// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

contract Claim is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    using MerkleProofUpgradeable for bytes32[];

    // New token
    IERC20 public newToken;

    // Merkle root for claim
    bytes32 public merkleRoot;

    struct Claimed {
        address user;
        uint256 amount;
        bool claimed;
    }
    mapping(address => Claimed) public claimed;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IERC20 _newToken,
        address _defaultAdmin,
        address _manager
    ) external initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(MANAGER_ROLE, _manager);
        _grantRole(MANAGER_ROLE, _manager);

        newToken = _newToken;
    }

    function updateClaim(
        bytes32 _merkleRoot,
        uint256 _poolAmount
    ) public onlyRole(MANAGER_ROLE) {
        require(_merkleRoot != bytes32(0), "INVALID_MERKLE_ROOT");

        merkleRoot = _merkleRoot;
        // Transfer pool amount to this contract
        if (_poolAmount > 0) {
            newToken.transferFrom(msg.sender, address(this), _poolAmount);
        }
    }

    function disableClaim() public onlyRole(MANAGER_ROLE) {
        merkleRoot = bytes32(0);
    }

    function claim(
        address _user,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external nonReentrant {
        require(merkleRoot != bytes32(0), "MERKLE_ROOT_NOT_SET");
        require(
            newToken.balanceOf(address(this)) >= _amount,
            "INSUFFICIENT_FUND"
        );
        require(!claimed[_user].claimed, "CLAIMED");
        require(
            _verifyMerkleProof(_user, _amount, _merkleProof),
            "INVALID_MERKLE_PROOF"
        );

        claimed[_user] = Claimed(_user, _amount, true);
        newToken.transfer(_user, _amount);
    }

    function _verifyMerkleProof(
        address _user,
        uint256 _amount,
        bytes32[] memory proof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(_user, _amount));
        return MerkleProofUpgradeable.verify(proof, merkleRoot, leaf);
    }

    // Withdraw all tokens from contract by owner
    function withdrawFunds(
        address _treasury
    ) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 _amount = newToken.balanceOf(address(this));
        require(_amount > 0, "NO_FUNDS");
        newToken.transfer(_treasury, _amount);
    }

    // Upgradeable function, Do not change this function
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(MANAGER_ROLE) {}
}
