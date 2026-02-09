// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title DoppelVesting
/// @notice Holds $DOPPEL tokens and releases them linearly over 60 days
contract DoppelVesting {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable start;
    uint256 public immutable duration;
    uint256 public totalAllocation;
    uint256 public released;

    event TokensDeposited(uint256 amount);
    event TokensReleased(uint256 amount);

    constructor(address _token, address _beneficiary, uint256 _duration) {
        require(_token != address(0), "token = zero");
        require(_beneficiary != address(0), "beneficiary = zero");
        require(_duration > 0, "duration = 0");

        token = IERC20(_token);
        beneficiary = _beneficiary;
        start = block.timestamp;
        duration = _duration;
    }

    /// @notice Deposit tokens to fund the vesting. Can only be called once.
    function deposit(uint256 amount) external {
        require(totalAllocation == 0, "already funded");
        totalAllocation = amount;
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(amount);
    }

    /// @notice Returns how many tokens have vested so far
    function vested() public view returns (uint256) {
        if (totalAllocation == 0) return 0;
        if (block.timestamp >= start + duration) {
            return totalAllocation;
        }
        return (totalAllocation * (block.timestamp - start)) / duration;
    }

    /// @notice Returns how many tokens are available to release right now
    function releasable() public view returns (uint256) {
        return vested() - released;
    }

    /// @notice Release vested tokens to the beneficiary. Anyone can call this.
    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "nothing to release");
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit TokensReleased(amount);
    }
}
