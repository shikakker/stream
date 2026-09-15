import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import Button from '../../components/button';
import FullpageLoader from '../../components/fullpage-loader';

type Props = null;

const DeleteAsset: React.FC<Props> = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [moderatorPassword, setModeratorPassword] = useState('');

  const rawAssetId = router.query.asset_id;
  const assetId = typeof rawAssetId === 'string' ? rawAssetId : '';

  const deleteAsset = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!assetId || !moderatorPassword || isLoading) return;

    setErrorMessage('');
    setIsLoading(true);

    try {
      const resp = await fetch(`/api/assets/${encodeURIComponent(assetId)}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slack_moderator_password: moderatorPassword,
        }),
      });

      if (!resp.ok) {
        setErrorMessage(
          resp.status === 401
            ? 'Moderator password was not accepted.'
            : `Unable to delete asset (${resp.status}).`,
        );
        return;
      }

      setModeratorPassword('');
      setIsDeleted(true);
    } catch (error) {
      console.error('Error deleting asset', error); // eslint-disable-line no-console
      setErrorMessage('Unable to delete asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!assetId) {
    return (
      <Layout>
        <div className="wrapper">
          <h1>Invalid moderation link</h1>
          <p>No asset ID was provided.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <FullpageLoader />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="wrapper">
        {isDeleted ? (
          <div role="status">Asset {assetId} is deleted.</div>
        ) : (
          <form className="form" onSubmit={deleteAsset}>
            <h1>Delete asset {assetId}</h1>
            <p>This action cannot be undone. Enter the moderator password to continue.</p>
            <label htmlFor="moderator-password">Moderator password</label>
            <input
              id="moderator-password"
              name="moderator-password"
              type="password"
              autoComplete="current-password"
              value={moderatorPassword}
              onChange={(event) => setModeratorPassword(event.target.value)}
              required
            />
            {errorMessage ? <p role="alert">{errorMessage}</p> : null}
            <Button type="submit" disabled={!moderatorPassword || isLoading}>
              Delete asset
            </Button>
          </form>
        )}
        <style jsx>{`
          .wrapper {
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .form {
            width: min(100%, 480px);
            display: grid;
            gap: 12px;
          }
          input {
            min-height: 44px;
            padding: 8px 12px;
            font: inherit;
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default DeleteAsset;
