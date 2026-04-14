import { ImageResponse } from 'next/og';
import { TbClipboardDataFilled } from 'react-icons/tb';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <TbClipboardDataFilled style={{ width: 32, height: 32, fill: '#0ea5e9' }} />
      </div>
    ),
    { ...size }
  );
}
