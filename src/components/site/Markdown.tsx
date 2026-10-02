import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Safe markdown (raw HTML is not rendered). */
export function Markdown({ children, className = "prose-story" }: { children?: string | null; className?: string }) {
  if (!children) return null;
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} {...(href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a> }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
