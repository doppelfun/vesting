// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/ClawdVesting.sol";

contract DeployClawdVesting is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // $CLAWD token on Base
        address clawdToken = 0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07;
        // Clawd's wallet (beneficiary)
        address beneficiary = 0x11ce532845cE0eAcdA41f72FDc1C88c335981442;
        // 10 minute vesting for testing
        uint256 duration = 10 minutes;

        new ClawdVesting(clawdToken, beneficiary, duration);
    }
}
