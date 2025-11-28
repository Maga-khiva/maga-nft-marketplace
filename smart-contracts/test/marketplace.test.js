// smart-contracts/tests/marketplace.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

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

    // Cancel
    await marketplace.connect(addr1).cancel(0);
    expect(await marketplace.listings(0)).to.equal(0);

    // List again
    await marketplace.connect(addr1).list(0, price);

    // Buy
    const tx = await marketplace.connect(addr2).buy(0, { value: price });
    await tx.wait();
    expect(await marketplace.ownerOf(0)).to.equal(addr2.address);
    expect(await marketplace.listings(0)).to.equal(0);
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
});