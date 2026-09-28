interface KVProps {
  label: string;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export const KV = ({ label, children, align = 'left' }: KVProps) => (
  <div className={`kv ${align === 'right' ? 'kv--right' : ''}`}>
    <div className="kv-label">{label}</div>
    <div className="kv-value">{children}</div>
  </div>
);
