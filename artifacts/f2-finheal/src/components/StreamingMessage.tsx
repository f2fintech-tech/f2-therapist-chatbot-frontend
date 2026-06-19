import { useState, useEffect, useRef } from "react";

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let keyIdx = 0;
  const key = () => `md-${keyIdx++}`;

  function renderInline(line: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      const token = match[0];
      if (token.startsWith("`")) {
        parts.push(<code key={key()} className="bg-gray-100 text-primary px-[4px] py-[1px] rounded-[4px] text-[12px] font-mono">{token.slice(1,-1)}</code>);
      } else if (token.startsWith("***")) {
        parts.push(<strong key={key()}><em>{token.slice(3,-3)}</em></strong>);
      } else if (token.startsWith("**") || token.startsWith("__")) {
        parts.push(<strong key={key()}>{token.slice(2,-2)}</strong>);
      } else if (token.startsWith("*")) {
        parts.push(<em key={key()}>{token.slice(1,-1)}</em>);
      }
      last = match.index + token.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { codeLines.push(lines[i]); i++; }
      nodes.push(<div key={key()} className="my-[10px] rounded-[10px] overflow-hidden border border-gray-200">{lang && <div className="bg-gray-100 text-[10px] text-gray-500 font-mono px-[12px] py-[4px] border-b border-gray-200">{lang}</div>}<pre className="bg-[#f8f9ff] text-[12px] font-mono text-gray-800 px-[14px] py-[12px] overflow-x-auto leading-[1.6] m-0"><code>{codeLines.join("\n")}</code></pre></div>);
      i++; continue;
    }
    if (/^[-*_]{3,}$/.test(line.trim())) { nodes.push(<hr key={key()} className="my-[12px] border-gray-200" />); i++; continue; }
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizeClass = level === 1 ? "text-[16px] font-bold" : level === 2 ? "text-[14px] font-bold" : "text-[13px] font-semibold";
      nodes.push(<div key={key()} className={`${sizeClass} text-gray-900 mt-[12px] mb-[4px]`}>{renderInline(headingMatch[2])}</div>);
      i++; continue;
    }
    if (/^[\-\*\u2022]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-\*\u2022]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[\-\*\u2022]\s+/,"")); i++; }
      nodes.push(<ul key={key()} className="my-[6px] pl-[4px] space-y-[4px]">{items.map((item,idx)=><li key={idx} className="flex gap-[8px] text-gray-800"><span className="text-primary mt-[1px] shrink-0 text-[10px]">●</span><span>{renderInline(item)}</span></li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/,"")); i++; }
      nodes.push(<ol key={key()} className="my-[6px] pl-[4px] space-y-[4px]">{items.map((item,idx)=><li key={idx} className="flex gap-[8px] text-gray-800"><span className="text-primary font-semibold shrink-0 text-[12px] min-w-[16px]">{idx+1}.</span><span>{renderInline(item)}</span></li>)}</ol>);
      continue;
    }
    if (!line.trim()) { nodes.push(<div key={key()} className="h-[6px]" />); i++; continue; }
    nodes.push(<span key={key()} className="block">{renderInline(line)}</span>);
    i++;
  }
  return nodes;
}

export default function StreamingMessage({ content, isStreaming }: StreamingMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const targetContentRef = useRef(content);

  targetContentRef.current = content;

  // Handle content updates and resets
  useEffect(() => {
    if (!content) {
      indexRef.current = 0;
      setDisplayedContent("");
      setIsTyping(false);
    } else if (indexRef.current > content.length) {
      indexRef.current = content.length;
      setDisplayedContent(content);
    } else {
      setIsTyping(true);
    }
  }, [content]);

  // Adaptive typewriter speed typing effect
  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(content);
      return;
    }

    let timeoutId: number;

    const tick = () => {
      const target = targetContentRef.current;
      const currentLen = indexRef.current;
      const targetLen = target.length;

      if (currentLen < targetLen) {
        // Calculate step dynamically to catch up if we are lagging
        const diff = targetLen - currentLen;
        let step = 1;
        if (diff > 150) {
          step = 8;
        } else if (diff > 80) {
          step = 5;
        } else if (diff > 30) {
          step = 3;
        } else if (diff > 10) {
          step = 2;
        }

        const nextLen = Math.min(currentLen + step, targetLen);
        indexRef.current = nextLen;
        setDisplayedContent(target.slice(0, nextLen));
        
        timeoutId = window.setTimeout(tick, 25);
      } else {
        if (!isStreaming) {
          setIsTyping(false);
          setDisplayedContent(target); // Match exact content at end
        } else {
          timeoutId = window.setTimeout(tick, 50);
        }
      }
    };

    tick();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isTyping, isStreaming, content]);

  // Scroll to bottom during streaming and progressive typing
  useEffect(() => {
    if ((isStreaming || isTyping) && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [displayedContent, isStreaming, isTyping]);

  const isEmpty = !displayedContent || displayedContent.trim() === "";

  return (
    <div ref={containerRef} className="streaming-message leading-relaxed text-[13px] sm:text-[13.5px] text-gray-800">
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .streaming-cursor { display:inline-block; width:2px; height:1em; background:#3344e6; margin-left:2px; vertical-align:text-bottom; border-radius:1px; animation:blink 0.85s step-start infinite; }
      `}</style>
      {isEmpty && isStreaming ? (
        <span className="inline-flex items-center gap-[4px] py-[2px]">
          <span className="w-[5px] h-[5px] rounded-full bg-primary opacity-40 animate-bounce" style={{animationDelay:"0ms"}} />
          <span className="w-[5px] h-[5px] rounded-full bg-primary opacity-40 animate-bounce" style={{animationDelay:"150ms"}} />
          <span className="w-[5px] h-[5px] rounded-full bg-primary opacity-40 animate-bounce" style={{animationDelay:"300ms"}} />
        </span>
      ) : (
        <>
          {renderMarkdown(displayedContent)}
          {(isStreaming || isTyping) && <span className="streaming-cursor" aria-hidden="true" />}
        </>
      )}
    </div>
  );
}
