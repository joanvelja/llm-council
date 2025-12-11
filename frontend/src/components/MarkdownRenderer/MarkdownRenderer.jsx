import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.css';

/**
 * Normalize math delimiters from various LLM formats to CommonMark-style.
 * Converts:
 *   \( ... \) → $ ... $   (inline math)
 *   \[ ... \] → $$ ... $$ (display math)
 */
function normalizeMathDelimiters(text) {
    if (!text) return text;

    let result = text;

    // Convert \[ ... \] to $$ ... $$ (display math)
    // Use non-greedy match to handle multiple occurrences
    result = result.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');

    // Convert \( ... \) to $ ... $ (inline math)
    result = result.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

    return result;
}

/**
 * MarkdownRenderer - Unified markdown rendering with math and code support.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks)
 * - LaTeX math rendering via KaTeX (supports $...$ and $$...$$)
 * - Automatic normalization of LLM-specific delimiters (\(...\), \[...\])
 * - Syntax highlighting for fenced code blocks
 *
 * @param {string} content - Markdown content to render
 * @param {string} className - Optional additional CSS class
 */
export default function MarkdownRenderer({ content, className }) {
    const normalized = normalizeMathDelimiters(content);

    return (
        <div className={`markdown-content ${className ?? ''}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    code({ inline, className: codeClassName, children, ...props }) {
                        const match = /language-(\w+)/.exec(codeClassName || '');
                        const codeString = String(children).replace(/\n$/, '');

                        if (!inline && match) {
                            return (
                                <SyntaxHighlighter
                                    language={match[1]}
                                    style={oneLight}
                                    PreTag="div"
                                    {...props}
                                >
                                    {codeString}
                                </SyntaxHighlighter>
                            );
                        }

                        return (
                            <code className={codeClassName} {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {normalized}
            </ReactMarkdown>
        </div>
    );
}
