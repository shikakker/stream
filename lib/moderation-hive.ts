import { ModerationScores } from '../types';
import { getThumbnailUrls } from './moderation-utils';

const HIVE_ENDPOINT = 'https://api.thehive.ai/api/v2/task/sync';
const isEnabled = () => !!(process.env.HIVE_AI_KEY?.length);

type HiveClass = {
  class: string;
  score: number;
};

type HiveOutput = {
  time: number,
  classes: HiveClass[],
}

type HiveResponse = {
  response: {
    output: HiveOutput[];
  };
}

type HiveResult = {
  code: number;
  status: HiveResponse[];
}

async function fetchOutputForUrl (url: string): Promise<HiveOutput|null> {
  let result: HiveResult;

  try {
    const response = await fetch(HIVE_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `token ${process.env.HIVE_AI_KEY}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.error('Hive moderation request failed', response.status); // eslint-disable-line no-console
      return null;
    }

    result = await response.json() as HiveResult;
  } catch (error) {
    console.error('Error requesting Hive moderation', error); // eslint-disable-line no-console
    return null;
  }

  if (result.code !== 200) {
    console.error('Error detecting scores for Hive', result.code); // eslint-disable-line no-console
    return null;
  }

  if (!(result.status?.[0]?.response?.output?.length)) {
    console.error('Hive response did not include moderation output'); // eslint-disable-line no-console
    return null;
  }

  return result.status[0].response.output[0];
}

function roundedScore (score: number): number {
  return +score.toFixed(6);
}

export function mergeAnnotations (outputs: HiveOutput[]): ModerationScores {
  const adultScores: number[] = [];
  const suggestiveScores: number[] = [];
  const violentScores: number[] = [];

  outputs.forEach((output) => {
    const nsfwScore = output.classes.find((cls => cls.class === 'general_nsfw'))?.score;
    if (nsfwScore) {
      adultScores.push(roundedScore(nsfwScore));
    }

    const suggestiveScore = output.classes.find((cls => cls.class === 'general_suggestive'))?.score;
    if (suggestiveScore) {
      suggestiveScores.push(roundedScore(suggestiveScore));
    }

    const bloodyScore = output.classes.find((cls => cls.class === 'very_bloody'))?.score;
    if (bloodyScore) {
      violentScores.push(roundedScore(bloodyScore));
    }
  });

  return {
    adult: adultScores.length ? Math.max(...adultScores) : undefined,
    suggestive: suggestiveScores.length ? Math.max(...suggestiveScores) : undefined,
    violent: violentScores.length ? Math.max(...violentScores) : undefined,
  };
}

export async function getScores ({ playbackId, duration }: { playbackId: string, duration: number }): Promise<ModerationScores|undefined> {
  if (!isEnabled()) {
    console.log('Skipping moderation-hive, no key enabled'); // eslint-disable-line no-console
    return undefined;
  }
  const files = getThumbnailUrls({ playbackId, duration });
  const outputs = await Promise.all(files.map((file) => fetchOutputForUrl(file)));
  const outputsFiltered = outputs.filter(a => !!a) as HiveOutput[];

  return mergeAnnotations(outputsFiltered);
}
