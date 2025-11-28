// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MagaMarketplace is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    mapping(uint256 => uint256) public listings; // tokenId => price in wei

    event Listed(uint256 indexed tokenId, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);
    event Bought(uint256 indexed tokenId, address buyer, uint256 price);

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
        _approve(address(this), tokenId, msg.sender);
        emit Listed(tokenId, price);
    }

    function cancel(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(listings[tokenId] > 0, "Not listed");
        delete listings[tokenId];
        _approve(address(0), tokenId, msg.sender);
        emit ListingCancelled(tokenId);
    }

    function buy(uint256 tokenId) public payable {
        uint256 price = listings[tokenId];
        require(price > 0, "Not listed");
        require(msg.value == price, "Wrong value");
        address seller = ownerOf(tokenId);
        delete listings[tokenId];
        _safeTransfer(seller, msg.sender, tokenId);
        payable(seller).transfer(price);
        emit Bought(tokenId, msg.sender, price);
    }
}
