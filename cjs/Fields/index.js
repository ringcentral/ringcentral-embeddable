"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fields = void 0;
const Alert_1 = require("./Alert");
const BooleanField_1 = __importDefault(require("./BooleanField"));
const Button_1 = require("./Button");
const Image_1 = require("./Image");
const Link_1 = require("./Link");
const List_1 = require("./List");
const Search_1 = require("./Search");
const Typography_1 = require("./Typography");
exports.fields = {
    admonition: Alert_1.Alert,
    BooleanField: BooleanField_1.default,
    button: Button_1.Button,
    image: Image_1.Image,
    link: Link_1.Link,
    list: List_1.List,
    search: Search_1.Search,
    typography: Typography_1.Typography,
};
//# sourceMappingURL=index.js.map