// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/DoppelVesting.sol";

contract DeployDoppelVesting is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // $DOPPEL token on Base
        address doppelToken = 0xf27b8ef47842E6445E37804896f1BC5e29381b07;
        // Doppel's wallet (beneficiary)
        address beneficiary = 0x984e9af2D4a66c52efE1b23DE9680A7c299E931f;
        // 60 day linear vesting
        uint256 duration = 60 days;

        new DoppelVesting(doppelToken, beneficiary, duration);
    }
}
