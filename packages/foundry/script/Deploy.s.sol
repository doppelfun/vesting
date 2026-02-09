//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeployDoppelVesting } from "./DeployDoppelVesting.s.sol";

contract DeployScript is ScaffoldETHDeploy {
  function run() external {
    DeployDoppelVesting deployDoppelVesting = new DeployDoppelVesting();
    deployDoppelVesting.run();
  }
}
