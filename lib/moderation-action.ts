import { ModerationScores } from '../types';
import Mux from '@mux/mux-node';

const { Video } = new Mux();

const ADULT_SCORE_THRESHHOLD = 0.95;
const VIOLENCE_SCORE_THRESHHOLD = 0.85;

async function saveDeletionRecordInAirtable ({ assetId, notes }: { assetId: string, notes: string }): Promise<void> {
  if (!(process.env.AIRTABLE_KEY && process.env.AIRTABLE_BASE_ID)) return;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(process.env.AIRTABLE_BASE_ID)}/Auto%20Deleted`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            { fields: { assetId, notes } },
          ],
        }),
      },
    );

    if (!response.ok) {
      console.error('Error reporting auto-delete to Airtable', response.status); // eslint-disable-line no-console
    }
  } catch (error) {
    console.error('Error reporting auto-delete to Airtable', error); // eslint-disable-line no-console
  }
}

function shouldAutoDeleteContent(hiveScores?: ModerationScores): boolean {
  const isAdult = (hiveScores && hiveScores.adult && hiveScores.adult >= ADULT_SCORE_THRESHHOLD || false);
  const isViolent = (hiveScores && hiveScores.violent && hiveScores.violent >= VIOLENCE_SCORE_THRESHHOLD || false);
  return isAdult || isViolent;
}

export async function autoDelete({ assetId, playbackId, hiveScores }: { assetId: string, playbackId: string, hiveScores: ModerationScores }): Promise<boolean> {
  if (shouldAutoDeleteContent(hiveScores)) {
    await Video.Assets.deletePlaybackId(assetId, playbackId);
    await saveDeletionRecordInAirtable({ assetId, notes: JSON.stringify(hiveScores) });

    return true;
  }

  return false;
}
