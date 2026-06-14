export default function TimestampLink({ timestamp, seconds, videoId, className = '' }) {
  const url = `https://www.youtube.com/watch?v=${videoId}&t=${seconds || 0}s`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded bg-amber-50 text-[#8B6914] hover:bg-amber-100 hover:text-[#6B4F10] transition-colors border border-[#C4A24A]/40 ${className}`}
      title={`Jump to ${timestamp} in video`}
    >
      ▶ {timestamp}
    </a>
  );
}