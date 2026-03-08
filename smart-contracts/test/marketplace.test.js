// smart-contracts/tests/marketplace.test.js
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MagaMarketplace", function () {
  let marketplace, owner, addr1, addr2;

  beforeEach(async function () {
    const MagaMarketplace = await ethers.getContractFactory("MagaMarketplace");
    marketplace = await MagaMarketplace.deploy();
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  it("Should mint an NFT", async function () {
    const tx = await marketplace.connect(addr1).mint("ipfs://test");
    await tx.wait();
    expect(await marketplace.ownerOf(0)).to.equal(addr1.address);
    expect(await marketplace.tokenURI(0)).to.equal("ipfs://test");
    expect(await marketplace.totalSupply()).to.equal(1);
  });

  it("Should list, cancel, and buy an NFT", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    const price = ethers.parseEther("1");

    // List
    await marketplace.connect(addr1).list(0, price);
    expect(await marketplace.listings(0)).to.equal(price);
    expect(await marketplace.listingSellers(0)).to.equal(addr1.address);

    // Cancel
    await marketplace.connect(addr1).cancel(0);
    expect(await marketplace.listings(0)).to.equal(0);
    expect(await marketplace.listingSellers(0)).to.equal(ethers.ZeroAddress);

    // List again
    await marketplace.connect(addr1).list(0, price);

    // Buy
    const tx = await marketplace.connect(addr2).buy(0, { value: price });
    await tx.wait();
    expect(await marketplace.ownerOf(0)).to.equal(addr2.address);
    expect(await marketplace.listings(0)).to.equal(0);
    expect(await marketplace.listingSellers(0)).to.equal(ethers.ZeroAddress);
  });

  it("Should fail to list if not owner", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    await expect(marketplace.connect(addr2).list(0, ethers.parseEther("1"))).to.be.revertedWith("Not owner");
  });

  it("Should fail to buy if not listed", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    await expect(marketplace.connect(addr2).buy(0, { value: ethers.parseEther("1") })).to.be.revertedWith("Not listed");
  });

  it("Should fail to buy with wrong value", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    await marketplace.connect(addr1).list(0, ethers.parseEther("1"));
    await expect(marketplace.connect(addr2).buy(0, { value: ethers.parseEther("0.5") })).to.be.revertedWith("Wrong value");
  });

  it("Should fail to buy stale listing after token transfer", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    const price = ethers.parseEther("1");
    await marketplace.connect(addr1).list(0, price);
    await marketplace.connect(addr1).transferFrom(addr1.address, owner.address, 0);
    await expect(marketplace.connect(addr2).buy(0, { value: price })).to.be.revertedWith("Listing stale");
  });

  it("Should place and replace highest offer with automatic refund", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    const firstOffer = ethers.parseEther("0.5");
    const secondOffer = ethers.parseEther("0.8");

    await marketplace.connect(addr2).placeOffer(0, { value: firstOffer });
    const [firstBidder, firstAmount] = await marketplace.highestOffers(0);
    expect(firstBidder).to.equal(addr2.address);
    expect(firstAmount).to.equal(firstOffer);

    const bidderTwoBalanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await marketplace.connect(owner).placeOffer(0, { value: secondOffer });
    await tx.wait();
    const bidderTwoBalanceAfter = await ethers.provider.getBalance(owner.address);

    const [secondBidder, secondAmount] = await marketplace.highestOffers(0);
    expect(secondBidder).to.equal(owner.address);
    expect(secondAmount).to.equal(secondOffer);
    expect(bidderTwoBalanceBefore - bidderTwoBalanceAfter).to.be.greaterThanOrEqual(secondOffer);
  });

  it("Should allow bidder to cancel own offer", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    const offer = ethers.parseEther("0.4");
    await marketplace.connect(addr2).placeOffer(0, { value: offer });
    await marketplace.connect(addr2).cancelOffer(0);
    const [bidder, amount] = await marketplace.highestOffers(0);
    expect(bidder).to.equal(ethers.ZeroAddress);
    expect(amount).to.equal(0);
  });

  it("Should allow owner to accept highest offer and transfer NFT", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    const offer = ethers.parseEther("0.7");
    await marketplace.connect(addr2).placeOffer(0, { value: offer });
    await marketplace.connect(addr1).acceptOffer(0);
    expect(await marketplace.ownerOf(0)).to.equal(addr2.address);
    const [bidder, amount] = await marketplace.highestOffers(0);
    expect(bidder).to.equal(ethers.ZeroAddress);
    expect(amount).to.equal(0);
  });

  it("Should fail to place lower or equal offer", async function () {
    await marketplace.connect(addr1).mint("ipfs://test");
    const offer = ethers.parseEther("0.5");
    await marketplace.connect(addr2).placeOffer(0, { value: offer });
    await expect(marketplace.connect(owner).placeOffer(0, { value: offer })).to.be.revertedWith("Offer too low");
  });
});
