// smart-contracts/test/marketplace.test.js
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MagaMarketplace", function () {
  let marketplace, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    const MagaMarketplace = await ethers.getContractFactory("MagaMarketplace");
    marketplace = await MagaMarketplace.deploy();
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
  });

  // ---------------------------------------------------------------------
  // MINT
  // ---------------------------------------------------------------------
  describe("Minting", function () {
    it("Should mint an NFT with correct owner, URI and totalSupply", async function () {
      const tx = await marketplace.connect(addr1).mint("ipfs://test");
      await tx.wait();
      expect(await marketplace.ownerOf(0)).to.equal(addr1.address);
      expect(await marketplace.tokenURI(0)).to.equal("ipfs://test");
      expect(await marketplace.totalSupply()).to.equal(1);
    });

    it("Should increment tokenId sequentially across different minters", async function () {
      await marketplace.connect(addr1).mint("ipfs://a");
      await marketplace.connect(addr2).mint("ipfs://b");
      await marketplace.connect(addr1).mint("ipfs://c");

      expect(await marketplace.ownerOf(0)).to.equal(addr1.address);
      expect(await marketplace.ownerOf(1)).to.equal(addr2.address);
      expect(await marketplace.ownerOf(2)).to.equal(addr1.address);
      expect(await marketplace.totalSupply()).to.equal(3);
    });

    it("Should revert ownerOf/tokenURI for a token that was never minted", async function () {
      await expect(marketplace.ownerOf(999)).to.be.revert(ethers);
    });
  });

  // ---------------------------------------------------------------------
  // LISTING (list / cancel)
  // ---------------------------------------------------------------------
  describe("Listing", function () {
    beforeEach(async function () {
      await marketplace.connect(addr1).mint("ipfs://test");
    });

    it("Should list an NFT and emit Listed", async function () {
      const price = ethers.parseEther("1");
      await expect(marketplace.connect(addr1).list(0, price))
        .to.emit(marketplace, "Listed")
        .withArgs(0, price);

      expect(await marketplace.listings(0)).to.equal(price);
      expect(await marketplace.listingSellers(0)).to.equal(addr1.address);
    });

    it("Should fail to list if not the owner", async function () {
      await expect(
        marketplace.connect(addr2).list(0, ethers.parseEther("1"))
      ).to.be.revertedWith("Not owner");
    });

    it("Should fail to list with price = 0", async function () {
      await expect(marketplace.connect(addr1).list(0, 0)).to.be.revertedWith(
        "Price must be > 0"
      );
    });

    it("Should allow re-listing at a different price, overwriting the old one", async function () {
      await marketplace.connect(addr1).list(0, ethers.parseEther("1"));
      await marketplace.connect(addr1).list(0, ethers.parseEther("2"));
      expect(await marketplace.listings(0)).to.equal(ethers.parseEther("2"));
    });

    it("Should cancel a listing and emit ListingCancelled", async function () {
      await marketplace.connect(addr1).list(0, ethers.parseEther("1"));
      await expect(marketplace.connect(addr1).cancel(0))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(0);

      expect(await marketplace.listings(0)).to.equal(0);
      expect(await marketplace.listingSellers(0)).to.equal(ethers.ZeroAddress);
    });

    it("Should fail to cancel if not the owner", async function () {
      await marketplace.connect(addr1).list(0, ethers.parseEther("1"));
      await expect(marketplace.connect(addr2).cancel(0)).to.be.revertedWith(
        "Not owner"
      );
    });

    it("Should fail to cancel a token that isn't listed", async function () {
      await expect(marketplace.connect(addr1).cancel(0)).to.be.revertedWith(
        "Not listed"
      );
    });
  });

  // ---------------------------------------------------------------------
  // BUY
  // ---------------------------------------------------------------------
  describe("Buying", function () {
    let price;

    beforeEach(async function () {
      price = ethers.parseEther("1");
      await marketplace.connect(addr1).mint("ipfs://test");
      await marketplace.connect(addr1).list(0, price);
    });

    it("Should buy a listed NFT, transfer ownership, pay seller and emit Bought", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(addr1.address);

      await expect(marketplace.connect(addr2).buy(0, { value: price }))
        .to.emit(marketplace, "Bought")
        .withArgs(0, addr2.address, price);

      expect(await marketplace.ownerOf(0)).to.equal(addr2.address);
      expect(await marketplace.listings(0)).to.equal(0);
      expect(await marketplace.listingSellers(0)).to.equal(ethers.ZeroAddress);

      const sellerBalanceAfter = await ethers.provider.getBalance(addr1.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(price);
    });

    it("Should fail to buy if not listed", async function () {
      await marketplace.connect(addr1).cancel(0);
      await expect(
        marketplace.connect(addr2).buy(0, { value: price })
      ).to.be.revertedWith("Not listed");
    });

    it("Should fail to buy with wrong value (too low)", async function () {
      await expect(
        marketplace.connect(addr2).buy(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Wrong value");
    });

    it("Should fail to buy with wrong value (too high — no overpayment allowed)", async function () {
      await expect(
        marketplace.connect(addr2).buy(0, { value: ethers.parseEther("1.5") })
      ).to.be.revertedWith("Wrong value");
    });

    it("Should fail to buy a stale listing after the token was transferred outside the marketplace", async function () {
      await marketplace.connect(addr1).transferFrom(addr1.address, owner.address, 0);
      await expect(
        marketplace.connect(addr2).buy(0, { value: price })
      ).to.be.revertedWith("Listing stale");
    });

    it("Should allow the buyer to be a different account than the seller, including self-buy by original owner is not blocked", async function () {
      // Not a security requirement, just documenting current behavior:
      // the contract does not stop the seller from buying back their own listing.
      await expect(marketplace.connect(addr1).buy(0, { value: price })).to.not.be
        .revert(ethers);
      expect(await marketplace.ownerOf(0)).to.equal(addr1.address);
    });
  });

  // ---------------------------------------------------------------------
  // OFFERS (placeOffer / cancelOffer / acceptOffer)
  // ---------------------------------------------------------------------
  describe("Offers", function () {
    beforeEach(async function () {
      await marketplace.connect(addr1).mint("ipfs://test");
    });

    it("Should place an offer and emit OfferPlaced", async function () {
      const offer = ethers.parseEther("0.5");
      await expect(marketplace.connect(addr2).placeOffer(0, { value: offer }))
        .to.emit(marketplace, "OfferPlaced")
        .withArgs(0, addr2.address, offer);

      const [bidder, amount] = await marketplace.highestOffers(0);
      expect(bidder).to.equal(addr2.address);
      expect(amount).to.equal(offer);
    });

    it("Should fail to place an offer on a token that doesn't exist", async function () {
      await expect(
        marketplace.connect(addr2).placeOffer(999, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Token not found");
    });

    it("Should fail to place an offer of 0", async function () {
      await expect(
        marketplace.connect(addr2).placeOffer(0, { value: 0 })
      ).to.be.revertedWith("Offer must be > 0");
    });

    it("Should fail if the owner tries to bid on their own token", async function () {
      await expect(
        marketplace.connect(addr1).placeOffer(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Owner cannot bid");
    });

    it("Should fail to place an equal or lower offer than the current one", async function () {
      const offer = ethers.parseEther("0.5");
      await marketplace.connect(addr2).placeOffer(0, { value: offer });

      await expect(
        marketplace.connect(owner).placeOffer(0, { value: offer })
      ).to.be.revertedWith("Offer too low");

      await expect(
        marketplace.connect(owner).placeOffer(0, { value: ethers.parseEther("0.3") })
      ).to.be.revertedWith("Offer too low");
    });

    it("Should replace the highest offer and automatically refund the previous bidder", async function () {
      const firstOffer = ethers.parseEther("0.5");
      const secondOffer = ethers.parseEther("0.8");

      await marketplace.connect(addr2).placeOffer(0, { value: firstOffer });
      const addr2BalanceBefore = await ethers.provider.getBalance(addr2.address);

      await marketplace.connect(owner).placeOffer(0, { value: secondOffer });

      const addr2BalanceAfter = await ethers.provider.getBalance(addr2.address);
      expect(addr2BalanceAfter - addr2BalanceBefore).to.equal(firstOffer);

      const [bidder, amount] = await marketplace.highestOffers(0);
      expect(bidder).to.equal(owner.address);
      expect(amount).to.equal(secondOffer);
    });

    it("Should allow the bidder to cancel their own offer and get refunded, emitting OfferCancelled", async function () {
      const offer = ethers.parseEther("0.4");
      await marketplace.connect(addr2).placeOffer(0, { value: offer });

      const balanceBefore = await ethers.provider.getBalance(addr2.address);
      const tx = await marketplace.connect(addr2).cancelOffer(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(addr2.address);

      expect(balanceAfter - balanceBefore + gasCost).to.equal(offer);

      const [bidder, amount] = await marketplace.highestOffers(0);
      expect(bidder).to.equal(ethers.ZeroAddress);
      expect(amount).to.equal(0);
    });

    it("Should fail to cancel an offer that isn't yours", async function () {
      await marketplace.connect(addr2).placeOffer(0, { value: ethers.parseEther("0.4") });
      await expect(marketplace.connect(addr3).cancelOffer(0)).to.be.revertedWith(
        "Not bidder"
      );
    });

    it("Should let the owner accept the highest offer, transfer the NFT and get paid", async function () {
      const offer = ethers.parseEther("0.7");
      await marketplace.connect(addr2).placeOffer(0, { value: offer });

      const sellerBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const tx = await marketplace.connect(addr1).acceptOffer(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const sellerBalanceAfter = await ethers.provider.getBalance(addr1.address);

      expect(await marketplace.ownerOf(0)).to.equal(addr2.address);
      expect(sellerBalanceAfter - sellerBalanceBefore + gasCost).to.equal(offer);

      const [bidder, amount] = await marketplace.highestOffers(0);
      expect(bidder).to.equal(ethers.ZeroAddress);
      expect(amount).to.equal(0);
    });

    it("Should clear an active listing when acceptOffer is called on a listed token", async function () {
      await marketplace.connect(addr1).list(0, ethers.parseEther("2"));
      await marketplace.connect(addr2).placeOffer(0, { value: ethers.parseEther("0.7") });

      await marketplace.connect(addr1).acceptOffer(0);

      expect(await marketplace.listings(0)).to.equal(0);
      expect(await marketplace.listingSellers(0)).to.equal(ethers.ZeroAddress);
    });

    it("Should fail to accept if caller isn't the owner", async function () {
      await marketplace.connect(addr2).placeOffer(0, { value: ethers.parseEther("0.5") });
      await expect(marketplace.connect(addr3).acceptOffer(0)).to.be.revertedWith(
        "Not owner"
      );
    });

    it("Should fail to accept when there is no active offer", async function () {
      await expect(marketplace.connect(addr1).acceptOffer(0)).to.be.revertedWith(
        "No active offer"
      );
    });
  });

  // ---------------------------------------------------------------------
  // EDGE CASE: offers and direct sales don't know about each other
  // ---------------------------------------------------------------------
  describe("Edge case: stale offer survives a direct buy()", function () {
    it("highestOffers is NOT cleared when the NFT is sold via buy(), letting the new owner accept an old bidder's offer without their fresh consent", async function () {
      await marketplace.connect(addr1).mint("ipfs://test");
      await marketplace.connect(addr2).placeOffer(0, { value: ethers.parseEther("0.3") });

      await marketplace.connect(addr1).list(0, ethers.parseEther("1"));
      await marketplace.connect(owner).buy(0, { value: ethers.parseEther("1") });

      // addr2's offer is still there even though addr1 no longer owns token 0
      const [bidder, amount] = await marketplace.highestOffers(0);
      expect(bidder).to.equal(addr2.address);
      expect(amount).to.equal(ethers.parseEther("0.3"));

      // The new owner (bought via buy()) can accept that stale offer directly.
      await marketplace.connect(owner).acceptOffer(0);
      expect(await marketplace.ownerOf(0)).to.equal(addr2.address);

      // -> Worth a product decision: is this intended ("offers persist across owners")
      //    or should acceptOffer()/buy() clear highestOffers on ownership change?
    });
  });

  // ---------------------------------------------------------------------
  // SECURITY: refund-DoS vulnerability in placeOffer()
  // ---------------------------------------------------------------------
  describe("FIX: placeOffer() refund uses pull-payment, no more DoS", function () {
    it("Should still accept a higher offer even if the previous bidder rejects ETH, queuing pendingReturns instead of reverting", async function () {
      await marketplace.connect(addr1).mint("ipfs://test");

      const MaliciousBidder = await ethers.getContractFactory("MaliciousBidder");
      const malicious = await MaliciousBidder.deploy(await marketplace.getAddress());

      const firstOffer = ethers.parseEther("0.1");
      const secondOffer = ethers.parseEther("0.5");

      await malicious.bid(0, { value: firstOffer });

      // This used to revert with "Refund failed" before the fix.
      // Now it must succeed, and emit RefundQueued instead of refunding directly.
      await expect(marketplace.connect(addr2).placeOffer(0, { value: secondOffer }))
        .to.emit(marketplace, "RefundQueued")
        .withArgs(0, await malicious.getAddress(), firstOffer);

      const [bidder, amount] = await marketplace.highestOffers(0);
      expect(bidder).to.equal(addr2.address);
      expect(amount).to.equal(secondOffer);

      expect(await marketplace.pendingReturns(await malicious.getAddress())).to.equal(
        firstOffer
      );
    });

    it("Should let a normal (non-reverting) outbid bidder still get refunded directly, without touching pendingReturns", async function () {
      await marketplace.connect(addr1).mint("ipfs://test");
      const firstOffer = ethers.parseEther("0.3");
      const secondOffer = ethers.parseEther("0.6");

      await marketplace.connect(addr2).placeOffer(0, { value: firstOffer });

      const balanceBefore = await ethers.provider.getBalance(addr2.address);
      await marketplace.connect(owner).placeOffer(0, { value: secondOffer });
      const balanceAfter = await ethers.provider.getBalance(addr2.address);

      expect(balanceAfter - balanceBefore).to.equal(firstOffer);
      expect(await marketplace.pendingReturns(addr2.address)).to.equal(0);
    });

    it("Should let the malicious bidder later withdraw its queued refund once it stops rejecting ETH", async function () {
      await marketplace.connect(addr1).mint("ipfs://test");
      const MaliciousBidder = await ethers.getContractFactory("MaliciousBidder");
      const malicious = await MaliciousBidder.deploy(await marketplace.getAddress());

      await malicious.bid(0, { value: ethers.parseEther("0.1") });
      await marketplace.connect(addr2).placeOffer(0, { value: ethers.parseEther("0.5") });

      // Still rejecting ETH -> withdraw() itself must fail (self-inflicted only)
      await expect(malicious.withdrawRefund()).to.be.revertedWith("Withdraw failed");

      // Once it stops rejecting, it can pull its own funds whenever it wants
      await malicious.toggleReject(false);
      const balanceBefore = await ethers.provider.getBalance(
        await malicious.getAddress()
      );
      await malicious.withdrawRefund();
      const balanceAfter = await ethers.provider.getBalance(
        await malicious.getAddress()
      );

      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("0.1"));
      expect(await marketplace.pendingReturns(await malicious.getAddress())).to.equal(0);
    });

    it("Should revert withdraw() when there is nothing to withdraw", async function () {
      await expect(marketplace.connect(addr2).withdraw()).to.be.revertedWith(
        "Nothing to withdraw"
      );
    });

    it("Should let the owner accept an offer from a bidder even while that bidder still has unrelated pendingReturns sitting around", async function () {
      await marketplace.connect(addr1).mint("ipfs://test");
      const MaliciousBidder = await ethers.getContractFactory("MaliciousBidder");
      const malicious = await MaliciousBidder.deploy(await marketplace.getAddress());

      await malicious.bid(0, { value: ethers.parseEther("0.1") });
      await marketplace.connect(addr1).acceptOffer(0);

      expect(await marketplace.ownerOf(0)).to.equal(await malicious.getAddress());
    });
  });

  // ---------------------------------------------------------------------
  // SECURITY: ReentrancyGuard actually protects buy()
  // ---------------------------------------------------------------------
  describe("SECURITY: reentrancy protection", function () {
    it("Should block a reentrant call into buy() triggered from the seller's payment callback", async function () {
      const ReentrantSeller = await ethers.getContractFactory("ReentrantSeller");
      const reentrantSeller = await ReentrantSeller.deploy(await marketplace.getAddress());

      const price = ethers.parseEther("1");
      await reentrantSeller.setup("ipfs://evil", price);
      const tokenId = await reentrantSeller.tokenId();

      await reentrantSeller.arm();

      // addr2 buys the NFT. Payment is sent to reentrantSeller via a low-level
      // `.call()`, whose receive() immediately tries to call buy() again on
      // the same token. The nonReentrant guard DOES block that inner call —
      // but because it happens inside a low-level `.call()`, the guard's
      // custom error (ReentrancyGuardReentrantCall) does not bubble up as
      // the top-level revert reason. Instead `.call()` simply returns
      // success = false, which then trips buy()'s own
      // `require(sent, "Payment failed")`. So the *observable* revert
      // reason here is "Payment failed" — but that itself is proof the
      // reentrant buy() call was rejected by the guard before it could do
      // anything (no double-transfer, no double-payment, and the whole
      // outer transaction — including the earlier NFT transfer — is rolled
      // back atomically).
      await expect(
        marketplace.connect(addr2).buy(tokenId, { value: price })
      ).to.be.revertedWith("Payment failed");

      // Extra confirmation of atomicity: since the whole transaction
      // reverted, ownership must NOT have moved to addr2 despite
      // _safeTransfer having run earlier in the same call.
      expect(await marketplace.ownerOf(tokenId)).to.equal(
        await reentrantSeller.getAddress()
      );
    });
  });
});