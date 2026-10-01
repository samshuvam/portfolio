import { ChatCircleDotsIcon } from '@phosphor-icons/react';
import { useStore } from '../../lib/store';

// Extra commentary that only appears in Yap mode.
export default function Yap({ children }) {
  const yap = useStore((s) => s.yap);
  return (
    <div className="yap" aria-hidden={!yap}>
      <div>
        <p className="yap-bubble">
          <ChatCircleDotsIcon size={20} weight="duotone" />
          {children}
        </p>
      </div>
    </div>
  );
}
