import supportedInterfaces from "./suites/supportedInterfaces.test";
import publicVariables from "./suites/publicVariables.test";
import baseURI from "./suites/baseURI.test";
import saleState from "./suites/saleState.test";
import moderator from "./suites/moderator.test";
import mint from "./suites/mint.test";
import giveaway from "./suites/giveaway.test";
import royalty from "./suites/royalty.test";
import burn from "./suites/burn.test";
import preAuthorized from "./suites/preAuthorized.test";
import signingTx from "./suites/signingTx.test";
import tokenData from "./suites/tokenData.test";

describe("Armory", function () {
  describe("When supporting interfaces", supportedInterfaces.bind(this));
  describe("When getting public variables", publicVariables.bind(this));
  describe("When setting baseURI", baseURI.bind(this));
  describe("When changing sale state", saleState.bind(this));
  describe("When updating ownership", moderator.bind(this));
  describe("When minting", mint.bind(this));
  describe("When giveaway", giveaway.bind(this));
  describe("When setting royalty receiver", royalty.bind(this));
  describe("When burning", burn.bind(this));
  describe("When pre authorizing", preAuthorized.bind(this));
  describe("When signing tx", signingTx.bind(this));
  describe("When setting token data", tokenData.bind(this));
});
