// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/DoppelVesting.sol";
import "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract DoppelVestingTest is Test {
    DoppelVesting public vesting;
    ERC20Mock public token;

    address public beneficiary;
    address public depositor;
    uint256 public constant DURATION = 60 days;
    uint256 public constant ALLOCATION = 1_000_000e18;

    event TokensDeposited(uint256 amount);
    event TokensReleased(uint256 amount);

    function setUp() public {
        token = new ERC20Mock();
        beneficiary = makeAddr("beneficiary");
        depositor = makeAddr("depositor");

        token.mint(depositor, ALLOCATION);

        vesting = new DoppelVesting(address(token), beneficiary, DURATION);
    }

    /* ---------- Constructor ---------- */

    function test_Constructor_RevertWhen_TokenZero() public {
        vm.expectRevert("token = zero");
        new DoppelVesting(address(0), beneficiary, DURATION);
    }

    function test_Constructor_RevertWhen_BeneficiaryZero() public {
        vm.expectRevert("beneficiary = zero");
        new DoppelVesting(address(token), address(0), DURATION);
    }

    function test_Constructor_RevertWhen_DurationZero() public {
        vm.expectRevert("duration = 0");
        new DoppelVesting(address(token), beneficiary, 0);
    }

    function test_Constructor_SetsImmutables() public view {
        assertEq(address(vesting.token()), address(token));
        assertEq(vesting.beneficiary(), beneficiary);
        assertEq(vesting.start(), block.timestamp);
        assertEq(vesting.duration(), DURATION);
        assertEq(vesting.totalAllocation(), 0);
        assertEq(vesting.released(), 0);
    }

    /* ---------- deposit ---------- */

    function test_Deposit_Success() public {
        vm.startPrank(depositor);
        token.approve(address(vesting), ALLOCATION);

        vm.expectEmit(true, true, true, true);
        emit TokensDeposited(ALLOCATION);
        vesting.deposit(ALLOCATION);
        vm.stopPrank();

        assertEq(vesting.totalAllocation(), ALLOCATION);
        assertEq(token.balanceOf(address(vesting)), ALLOCATION);
        assertEq(token.balanceOf(depositor), 0);
    }

    function test_Deposit_RevertWhen_AlreadyFunded() public {
        vm.startPrank(depositor);
        token.approve(address(vesting), ALLOCATION);
        vesting.deposit(ALLOCATION);

        vm.expectRevert("already funded");
        vesting.deposit(1);
        vm.stopPrank();
    }

    function test_Deposit_RevertWhen_InsufficientBalance() public {
        vm.prank(depositor);
        vm.expectRevert();
        vesting.deposit(ALLOCATION); // no approve
    }

    /* ---------- vested ---------- */

    function test_Vested_ZeroBeforeDeposit() public view {
        assertEq(vesting.vested(), 0);
    }

    function test_Vested_ZeroAtStart() public {
        _deposit();
        assertEq(vesting.vested(), 0);
    }

    function test_Vested_LinearOverTime() public {
        _deposit();

        vm.warp(block.timestamp + 30 days);
        assertEq(vesting.vested(), ALLOCATION / 2);

        vm.warp(block.timestamp + 15 days); // 45 days total
        assertEq(vesting.vested(), (ALLOCATION * 45) / 60);
    }

    function test_Vested_FullAtEnd() public {
        _deposit();
        vm.warp(block.timestamp + DURATION);
        assertEq(vesting.vested(), ALLOCATION);
    }

    function test_Vested_FullAfterEnd() public {
        _deposit();
        vm.warp(block.timestamp + DURATION + 30 days);
        assertEq(vesting.vested(), ALLOCATION);
    }

    /* ---------- releasable ---------- */

    function test_Releasable_EqualsVestedMinusReleased() public {
        _deposit();
        assertEq(vesting.releasable(), vesting.vested());

        vm.warp(block.timestamp + 30 days);
        assertEq(vesting.releasable(), ALLOCATION / 2);

        vm.prank(beneficiary);
        vesting.release(); // release half

        assertEq(vesting.releasable(), 0);
        vm.warp(block.timestamp + 30 days); // full duration now
        assertEq(vesting.releasable(), ALLOCATION / 2);
    }

    /* ---------- release ---------- */

    function test_Release_RevertWhen_NothingToRelease() public {
        vm.expectRevert("nothing to release");
        vesting.release();
    }

    function test_Release_RevertWhen_NoDepositYet() public {
        vm.warp(block.timestamp + 1);
        vm.expectRevert("nothing to release");
        vesting.release();
    }

    function test_Release_TransfersToBeneficiary() public {
        _deposit();
        vm.warp(block.timestamp + 30 days);

        uint256 balanceBefore = token.balanceOf(beneficiary);
        uint256 amount = vesting.releasable();

        vm.expectEmit(true, true, true, true);
        emit TokensReleased(amount);
        vesting.release();

        assertEq(token.balanceOf(beneficiary), balanceBefore + amount);
        assertEq(vesting.released(), amount);
    }

    function test_Release_AnyoneCanCall() public {
        _deposit();
        vm.warp(block.timestamp + 30 days);

        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vesting.release();

        assertEq(token.balanceOf(beneficiary), ALLOCATION / 2);
    }

    function test_Release_MultipleCallsOverTime() public {
        _deposit();

        vm.warp(block.timestamp + 20 days);
        vesting.release();
        assertEq(token.balanceOf(beneficiary), (ALLOCATION * 20) / 60);
        assertEq(vesting.released(), (ALLOCATION * 20) / 60);

        vm.warp(block.timestamp + 20 days); // 40 days total
        vesting.release();
        assertEq(token.balanceOf(beneficiary), (ALLOCATION * 40) / 60);
        assertEq(vesting.released(), (ALLOCATION * 40) / 60);

        vm.warp(block.timestamp + 25 days); // 65 days, past end
        vesting.release();
        assertEq(token.balanceOf(beneficiary), ALLOCATION);
        assertEq(vesting.released(), ALLOCATION);
    }

    function test_Release_AfterFullDuration_ReleasesRemaining() public {
        _deposit();
        vm.warp(block.timestamp + DURATION);

        vesting.release();
        assertEq(token.balanceOf(beneficiary), ALLOCATION);
        assertEq(vesting.released(), ALLOCATION);
        assertEq(token.balanceOf(address(vesting)), 0);
    }

    function test_Release_SecondCallWhenNothingNewReverts() public {
        _deposit();
        vm.warp(block.timestamp + 30 days);
        vesting.release();

        vm.expectRevert("nothing to release");
        vesting.release();
    }

    /* ---------- Helpers ---------- */

    function _deposit() internal {
        vm.prank(depositor);
        token.approve(address(vesting), ALLOCATION);
        vm.prank(depositor);
        vesting.deposit(ALLOCATION);
    }
}
