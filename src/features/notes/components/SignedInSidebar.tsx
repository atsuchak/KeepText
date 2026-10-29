type Props = { onClose: () => void };

export function SignedInSidebar({ onClose }: Props) {
  return (
    <aside className="sidebar" aria-label="Notes sidebar">
      <div className="sidebar-heading">
        <span>Notes</span>
        <button onClick={onClose} type="button" aria-label="Close sidebar">×</button>
      </div>
    </aside>
  );
}
