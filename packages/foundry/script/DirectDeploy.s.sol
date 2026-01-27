// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/ClawdVesting.sol";

contract DirectDeploy is Script {
    function run() external {
        vm.startBroadcast();

        // $CLAWD token on Base
        address clawdToken = 0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07;
        // Clawd's wallet (beneficiary)
        address beneficiary = 0x11ce532845cE0eAcdA41f72FDc1C88c335981442;
        // 30 day linear vesting
        uint256 duration = 30 days;

        ClawdVesting vesting = new ClawdVesting(clawdToken, beneficiary, duration);
        console.log("ClawdVesting deployed to:", address(vesting));

        vm.stopBroadcast();
    }
}
