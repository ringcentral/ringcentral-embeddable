"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextWithMarkdown = TextWithMarkdown;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
function getSafeHref(url) {
    if (!url) {
        return '#';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return '#';
    }
    if (url.toLowerCase().includes('javascript')) {
        return '#';
    }
    return url;
}
function getMarkdownMatches(text) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldRegex = /\*\*([^\*]+)\*\*/g;
    const matches = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(text)) !== null) {
        matches.push({
            fullMatch: linkMatch[0],
            index: linkMatch.index,
            length: linkMatch[0].length,
            text: linkMatch[1],
            type: 'link',
            url: linkMatch[2],
        });
    }
    let boldMatch;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
        matches.push({
            fullMatch: boldMatch[0],
            index: boldMatch.index,
            length: boldMatch[0].length,
            text: boldMatch[1],
            type: 'bold',
        });
    }
    return matches.sort((a, b) => a.index - b.index);
}
function TextWithMarkdown({ text = '' }) {
    const matches = getMarkdownMatches(text);
    if (matches.length === 0) {
        return react_1.default.createElement(react_1.default.Fragment, null, text);
    }
    const parts = [];
    let lastIndex = 0;
    matches.forEach((match) => {
        if (match.index > lastIndex) {
            parts.push(react_1.default.createElement("span", { key: `text-${lastIndex}` }, text.slice(lastIndex, match.index)));
        }
        if (match.type === 'link') {
            parts.push(react_1.default.createElement(spring_ui_1.Link, { key: `link-${match.index}`, href: getSafeHref(match.url), target: "_blank", rel: "noopener noreferrer" }, match.text));
        }
        else {
            parts.push(react_1.default.createElement("strong", { key: `bold-${match.index}` }, match.text));
        }
        lastIndex = match.index + match.length;
    });
    if (lastIndex < text.length) {
        parts.push(react_1.default.createElement("span", { key: `text-${lastIndex}` }, text.slice(lastIndex)));
    }
    return react_1.default.createElement(react_1.default.Fragment, null, parts);
}
//# sourceMappingURL=TextWithMarkdown.js.map