import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { authGateway, session } from '../../app/bootstrap/services';
import {
  useTranslation,
  languages,
  languageLabels,
  type Language,
} from '../../services/localization';
import { assetManager } from '../../services/assets/AssetManager';
import { updateSettings } from '../../services/settings';
import {
  AssetImage,
  GamePanel,
  GameButton,
  GameModal,
  ErrorState,
  StatusBadge,
} from '../../ui/components';
export function AuthPage({ signup = false }: { signup?: boolean }) {
  useEffect(() => {
    void assetManager.preload('login').catch(() => {});
  }, []);
  const { t, language } = useTranslation(),
    navigate = useNavigate(),
    location = useLocation();
  const [email, setEmail] = useState(signup ? '' : 'demo@living.world'),
    [password, setPassword] = useState(signup ? '' : 'demo1234'),
    [confirmPassword, setConfirmPassword] = useState(''),
    [nickname, setNickname] = useState(''),
    [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false),
    [errorKey, setError] = useState<string | null>(null),
    [modal, setModal] = useState<'reset' | 'terms' | null>(null),
    [resetDone, setResetDone] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (
      !z.string().email().safeParse(email.trim()).success ||
      (signup &&
        (password.length < 8 ||
          password !== confirmPassword ||
          nickname.trim().length < 2 ||
          !terms))
    ) {
      setError('auth.invalid');
      return;
    }
    setBusy(true);
    try {
      const user = signup
        ? await authGateway.signup({
            email: email.trim(),
            password,
            nickname: nickname.trim(),
            language,
            terms,
          })
        : await authGateway.login(email, password);
      session.set(user);
      navigate('/game', { replace: true });
    } catch (error) {
      const key = error instanceof Error ? error.message : '';
      setError(key.startsWith('auth.') ? key : 'common.error');
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    setBusy(true);
    setError(null);
    try {
      await authGateway.resetPassword(email);
      setResetDone(true);
    } catch {
      setError('auth.invalid');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <AssetImage assetId="framework.background.login" alt="" className="auth-background" eager />
      <div className="auth-vignette" />
      <section className="auth-brand">
        <div className="brand-sigil">◇</div>
        <span className="eyebrow">{t('auth.eyebrow')}</span>
        <h1>
          LIVING
          <br />
          <span>WORLD</span>
        </h1>
        <p>{t('auth.tagline')}</p>
        <StatusBadge>{t('common.mock')}</StatusBadge>
      </section>
      <div className="auth-form-wrap">
        <GamePanel title={t(signup ? 'auth.signup' : 'auth.login')} className="auth-panel">
          <label className="language-select">
            {t('settings.language')}
            <select
              value={language}
              aria-label={t('settings.language')}
              onChange={(e) =>
                updateSettings((s) => ({ ...s, language: e.target.value as Language }))
              }
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {languageLabels[l]}
                </option>
              ))}
            </select>
          </label>
          {location.state?.expired && <ErrorState error={t('auth.expired')} />}
          <form
            onSubmit={(e) => {
              void submit(e);
            }}
            className="game-form"
          >
            <label>
              {t('auth.email')}
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                maxLength={120}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              {t('auth.password')}
              <input
                type="password"
                required
                minLength={signup ? 8 : undefined}
                autoComplete={signup ? 'new-password' : 'current-password'}
                value={password}
                maxLength={100}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {signup && (
              <>
                <label>
                  {t('auth.confirmPassword')}
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    maxLength={100}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
                <label>
                  {t('auth.nickname')}
                  <input
                    required
                    minLength={2}
                    maxLength={20}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </label>
                <label className="terms-checkbox">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    required
                  />
                  <span>{t('auth.terms')}</span>
                </label>
                <GameButton type="button" onClick={() => setModal('terms')}>
                  {t('auth.terms')}
                </GameButton>
              </>
            )}
            {errorKey && <ErrorState error={t(errorKey)} />}
            <GameButton type="submit" variant="primary" loading={busy}>
              {t(signup ? 'auth.signup' : 'common.enter')}
            </GameButton>
          </form>
          <div className="auth-links">
            <Link to={signup ? '/login' : '/signup'}>
              {t(signup ? 'auth.login' : 'auth.signup')}
            </Link>
            <GameButton
              onClick={() => {
                setModal('reset');
                setResetDone(false);
                setError(null);
              }}
            >
              {t('auth.reset')}
            </GameButton>
          </div>
          {!signup && <p className="demo-credentials">{t('auth.credentials')}</p>}
          <p className="muted auth-disclaimer">{t('common.mockHint')}</p>
        </GamePanel>
      </div>
      {modal === 'terms' && (
        <GameModal title={t('auth.terms')} onClose={() => setModal(null)}>
          <p>{t('auth.termsBody')}</p>
        </GameModal>
      )}
      {modal === 'reset' && (
        <GameModal title={t('auth.reset')} onClose={() => setModal(null)}>
          {resetDone ? (
            <StatusBadge kind="success">{t('auth.resetSent')}</StatusBadge>
          ) : (
            <form
              className="game-form"
              onSubmit={(e) => {
                e.preventDefault();
                void reset();
              }}
            >
              <label>
                {t('auth.email')}
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <GameButton type="submit" loading={busy}>
                {t('auth.reset')}
              </GameButton>
            </form>
          )}
          {errorKey && <ErrorState error={t(errorKey)} />}
        </GameModal>
      )}
    </main>
  );
}
