// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "erc721a/contracts/extensions/ERC721ABurnable.sol";

contract StandardERC721A is ERC721ABurnable {
    string public __baseURI;

    constructor() ERC721A("", "") {}

    function safeMintTo(address to, uint256 quantity) public {
        _safeMint(to, quantity);
    }

    function safeMint(uint256 quantity) public {
        _safeMint(msg.sender, quantity);
    }

    function _baseURI() internal view override returns (string memory) {
        return __baseURI;
    }

    function setBaseURI(string memory baseURI_) public {
        __baseURI = baseURI_;
    }
}
