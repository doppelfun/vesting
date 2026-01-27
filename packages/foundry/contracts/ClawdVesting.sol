// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ClawdVesting
/// @notice Holds $CLAWD tokens and releases them linearly over 30 days
contract ClawdVesting {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable start;
    uint256 public immutable duration;
    uint256 public released;

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

    /// @notice Returns how many tokens have vested so far
    function vested() public view returns (uint256) {
        uint256 totalAllocation = token.balanceOf(address(this)) + released;
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
