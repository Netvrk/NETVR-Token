// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract Token is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable,
    ERC20PermitUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    mapping(address => bool) public isBlocked;
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    event AddressBlocked(address indexed addr);
    event AddressUnblocked(address indexed addr);
    event StuckTokenWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address defaultAdmin,
        address pauser,
        address upgrader
    ) public initializer {
        __ERC20_init("Tokenz", "TKNZ");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();
        __ERC20Permit_init("Tokenz");
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MANAGER_ROLE, pauser);
        _grantRole(UPGRADER_ROLE, upgrader);

        _mint(msg.sender, 100000000 * 10 ** decimals());
    }

    function pause() public onlyRole(MANAGER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(MANAGER_ROLE) {
        _unpause();
    }

    /**
     * @notice  Function used to block an address in case of breach
     */
    function blockAddress(
        address addressToBlock
    ) external onlyRole(MANAGER_ROLE) {
        isBlocked[addressToBlock] = true;
        emit AddressBlocked(addressToBlock);
    }

    /**
     * @notice  Function used to unblock an address in case of false block
     */
    function unblockAddress(
        address addressToUnblock
    ) external onlyRole(MANAGER_ROLE) {
        isBlocked[addressToUnblock] = false;
        emit AddressUnblocked(addressToUnblock);
    }

    /**
     * @notice  Function for withdraw of accidentally stuck tokens on contract
     */
    function withdrawTokenIfStuck(
        address token,
        address beneficiary,
        uint256 amount
    ) external nonReentrant onlyRole(MANAGER_ROLE) {
        require(
            IERC20(token).balanceOf(address(this)) >= amount,
            "NOT_ENOUGH_TOKENS"
        );
        IERC20(token).transfer(beneficiary, amount);
        emit StuckTokenWithdrawn(token, beneficiary, amount);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    // The following functions are overrides required by Solidity.
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        super._update(from, to, value);
        require(!paused(), "TOKEN_PAUSED.");
        require(!isBlocked[from], "SENDER_BLOCKED");
        require(!isBlocked[to], "RECEIVER_BLOCKED");
    }
}