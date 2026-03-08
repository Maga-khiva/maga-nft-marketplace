// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MagaMarketplace is ERC721URIStorage, Ownable, ReentrancyGuard {
    struct Offer {
        address bidder;
        uint256 amount;
    }

    uint256 private _nextTokenId;

    mapping(uint256 => uint256) public listings; // tokenId => price in wei
    mapping(uint256 => address) public listingSellers; // tokenId => seller snapshot at listing time
    mapping(uint256 => Offer) public highestOffers; // tokenId => top escrowed offer

    event Listed(uint256 indexed tokenId, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);
    event Bought(uint256 indexed tokenId, address buyer, uint256 price);
    event OfferPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event OfferCancelled(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event OfferAccepted(uint256 indexed tokenId, address indexed seller, address indexed bidder, uint256 amount);

    constructor() ERC721("MagaNFT", "MAGANFT") Ownable(msg.sender) {}

    function mint(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    function list(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        listings[tokenId] = price;
        listingSellers[tokenId] = msg.sender;
        _approve(address(this), tokenId, msg.sender);
        emit Listed(tokenId, price);
    }

    function cancel(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(listings[tokenId] > 0, "Not listed");
        _clearListing(tokenId, msg.sender);
    }

    function buy(uint256 tokenId) public payable nonReentrant {
        uint256 price = listings[tokenId];
        require(price > 0, "Not listed");
        require(msg.value == price, "Wrong value");
        address seller = listingSellers[tokenId];
        require(seller != address(0), "Invalid listing");
        require(ownerOf(tokenId) == seller, "Listing stale");
        _clearListing(tokenId, seller);
        _safeTransfer(seller, msg.sender, tokenId);
        (bool sent, ) = payable(seller).call{value: price}("");
        require(sent, "Payment failed");
        emit Bought(tokenId, msg.sender, price);
    }

    function placeOffer(uint256 tokenId) public payable nonReentrant {
        require(tokenId < _nextTokenId, "Token not found");
        address owner = ownerOf(tokenId);
        require(msg.sender != owner, "Owner cannot bid");
        require(msg.value > 0, "Offer must be > 0");

        Offer memory current = highestOffers[tokenId];
        require(msg.value > current.amount, "Offer too low");

        if (current.bidder != address(0)) {
            (bool refunded, ) = payable(current.bidder).call{value: current.amount}("");
            require(refunded, "Refund failed");
        }

        highestOffers[tokenId] = Offer({ bidder: msg.sender, amount: msg.value });
        emit OfferPlaced(tokenId, msg.sender, msg.value);
    }

    function cancelOffer(uint256 tokenId) public nonReentrant {
        Offer memory current = highestOffers[tokenId];
        require(current.bidder == msg.sender, "Not bidder");
        uint256 amount = current.amount;
        delete highestOffers[tokenId];
        (bool refunded, ) = payable(msg.sender).call{value: amount}("");
        require(refunded, "Refund failed");
        emit OfferCancelled(tokenId, msg.sender, amount);
    }

    function acceptOffer(uint256 tokenId) public nonReentrant {
        address owner = ownerOf(tokenId);
        require(owner == msg.sender, "Not owner");

        Offer memory current = highestOffers[tokenId];
        require(current.bidder != address(0) && current.amount > 0, "No active offer");

        if (listings[tokenId] > 0) {
            _clearListing(tokenId, msg.sender);
        }

        delete highestOffers[tokenId];
        _safeTransfer(msg.sender, current.bidder, tokenId);
        (bool paid, ) = payable(msg.sender).call{value: current.amount}("");
        require(paid, "Payment failed");
        emit OfferAccepted(tokenId, msg.sender, current.bidder, current.amount);
    }

    function _clearListing(uint256 tokenId, address owner) internal {
        delete listings[tokenId];
        delete listingSellers[tokenId];
        _approve(address(0), tokenId, owner);
        emit ListingCancelled(tokenId);
    }
}
