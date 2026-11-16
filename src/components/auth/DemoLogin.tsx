import { FormEvent, useState } from 'react';
import { signInDemo } from '../../api/demoWorkspace';

interface DemoLoginProps {
  workspaceId: string | null;
  onSignedIn: () => void;
  serviceError: string | null;
  onRetryService: () => void;
}

export function DemoLogin({ workspaceId, onSignedIn, serviceError, onRetryService }: DemoLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!workspaceId) {
      setError('Browser storage is required to create a private demo workspace.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signInDemo(password, workspaceId);
      setPassword('');
      onSignedIn();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8f9ff] p-6">
      <section className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#091426] text-sm font-bold text-white">
            AN
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0051d5]">Academic Nexus</p>
            <p className="text-sm text-[#45474c]">School planning demo</p>
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold text-[#0b1c30]">Sign in to the demo</h1>
        <p className="mt-2 text-sm leading-6 text-[#45474c]">
          Enter the shared demo password to open the fictional school workspace.
        </p>
        {serviceError ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p role="alert">{serviceError}</p>
            <button type="button" className="mt-2 font-semibold underline" onClick={onRetryService}>
              Retry connection
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-[#0b1c30]" htmlFor="demo-password">
              Demo password
              <input
                id="demo-password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 block w-full rounded-lg border border-[#cbd5e1] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-blue-100"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#091426] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
        <p className="mt-5 border-t border-[#e2e8f0] pt-4 text-xs leading-5 text-[#45474c]">
          This preview uses fictional data and a shared password, not individual accounts. Do not enter real student information.
        </p>
      </section>
    </main>
  );
}
