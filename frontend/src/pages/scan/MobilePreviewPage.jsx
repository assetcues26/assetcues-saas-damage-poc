import { useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Check, Trash2 } from 'lucide-react';

import { CompactHeader } from '../../components/layout/AppHeader';

import { BackButton } from '../../components/ui/BackButton';

import { Button } from '@/components/ui/button';

import { useApp } from '../../context/AppContext';

import { uploadSessionImagesPrepared } from '../../services/sessionApi';
import { useMobileSession } from '../../hooks/useMobileSession';



export function MobilePreviewPage() {

  const { token } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const { showToast } = useApp();
  const { session } = useMobileSession(token);

  const [payload, setPayload] = useState(location.state);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);



  useEffect(() => {

    if (!payload?.file) {

      navigate(`/scan/${token}/capture`, { replace: true });

    }

  }, [payload, navigate, token]);



  if (!payload?.file) return null;



  const discard = () => {

    if (payload.previewUrl) URL.revokeObjectURL(payload.previewUrl);

    navigate(`/scan/${token}/capture`);

  };



  const save = async () => {

    setSaving(true);

    setError(null);

    try {

      await uploadSessionImagesPrepared(token, payload.file, 'mobile', {

        sessionImages: session?.images,

      });

      if (payload.previewUrl) URL.revokeObjectURL(payload.previewUrl);

      navigate(`/scan/${token}/done`);

    } catch (err) {

      const message = err?.message || 'Upload failed';

      setError(message);

      showToast(message, 'error');

    } finally {

      setSaving(false);

    }

  };



  return (

    <div className="flex min-h-[100dvh] flex-col bg-zinc-50">

      <CompactHeader

        title="Preview"

        left={<BackButton label="Back" onClick={discard} />}

      />

      <div className="flex flex-1 items-center justify-center bg-black p-4">

        <img

          src={payload.previewUrl}

          alt="Preview"

          className="max-h-[60dvh] max-w-full object-contain"

        />

      </div>

      {error && (

        <p className="px-4 text-center text-sm text-red-600" role="alert">

          {error}

        </p>

      )}

      <div className="flex gap-3 border-t border-gray-200 bg-white p-4 pb-safe">

        <Button variant="outline" className="flex-1" onClick={discard}>

          <Trash2 className="me-2" size={18} aria-hidden />

          Discard

        </Button>

        <Button variant="primary" className="flex-1" disabled={saving} onClick={save}>

          <Check className="me-2" size={18} aria-hidden />

          {saving ? 'Adding…' : 'Add to batch'}

        </Button>

      </div>

    </div>

  );

}

