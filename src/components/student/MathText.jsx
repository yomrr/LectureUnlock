import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Splits text into plain-text and $...$ math segments and renders them
export default function MathText({ text = '' }) {
  if (!text) return null;

  // Match inline math: $...$
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const expr = part.slice(1, -1);
          try {
            return <InlineMath key={i} math={expr} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}