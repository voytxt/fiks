import { assert } from 'jsr:@std/assert';

const input = Deno.readTextFileSync('./io/input.txt')
  .split('\n')
  .map((e) => e.split(' '));
function readline(): string[] {
  const line = input.shift();
  assert(line !== undefined);

  return line;
}
const t = +readline();

for (let i = 0; i < t; i++) {
  const input = getInput();

  // nejprve zkusíme, jestli vůbec s našim počtem bodů `maxPointsToSpend` jde stabilní posádka udělat
  // pokud jde, musíme binary searchnout nejvyšší možnou kompetenci takové posádky
  // pokud naopak nejde, tak stačí rovnou vrátit ajajaj
  if (canCrewBeStable(input, 0n)) {
    const min = input.initialPoints.reduce((a, b) => (a < b ? a : b));
    const max = min + input.maxPointsToSpend;

    const maxPossibleCompetence = binarySearch(input, min, max);
    console.log(maxPossibleCompetence.toString());
  } else {
    console.log('ajajaj');
  }
}

/**
 * @property root - velitel posádky
 * @property children - děti jednotlivých členů (index: člen; hodnota: jeho děti)
 * @property initialPoints - počáteční kompetence (počet bodů) jednotlivých členů, kde index je člen a hodnota jsou jeho body
 * @property maxPointsToSpend - počet podů, které můžeme využít
 */
type Input = {
  root: number;
  children: ReadonlyArray<ReadonlyArray<number>>;
  initialPoints: ReadonlyArray<bigint>;
  maxPointsToSpend: bigint;
};

function getInput(): Input {
  const lines = [readline(), readline(), readline()];

  const memberCount = +lines[0][0]; // n
  const maxPointsToSpend = BigInt(lines[0][1]); // k
  const initialPoints = lines[1].map((e) => BigInt(e)); // a

  /**
   * nadřízení (rodiče) jednotlivých členů,
   * pokud je člen velitel posádky (nemá rodiče), tak je jeho hodnota -1
   *
   * index: člen; hodnota: jeho rodič
   */
  const parents = lines[2] // p
    .map((n) => (n === '-1' ? -1 : +n - 1)); // převedeme 1-based indexing členů na 0-based, ať v tom není guláš

  const { root, children } = getChildren(memberCount, parents);

  /**
   * převede seznam rodičů jednotlivých členů na seznam dětí každého ze členů;
   * také vrátí velitele posádky - ten v seznamu dětí není, protože žádného rodiče nemá
   *
   * @param n - počet členů
   * @param p - rodiče jednotlivých členů
   * @returns velitele posádky a seznam dětí jednotlivých členů
   */
  function getChildren(n: number, p: number[]): { root: number; children: number[][] } {
    let root: number | null = null;
    const children: number[][] = new Array(n).fill(null).map(() => []);

    for (let i = 0; i < p.length; i++) {
      const child = i;
      const parent = p[i];

      if (parent === -1) {
        root = child;
      } else {
        children[parent].push(child);
      }
    }

    assert(root !== null);

    return { root, children };
  }

  return { root, children, initialPoints, maxPointsToSpend };
}

/** může být posádka stabilní, když bude každý člen mít kompetenci minimálně `minPoints`? */
function canCrewBeStable(
  { root, children, initialPoints, maxPointsToSpend }: Input,
  minPoints: bigint
) {
  const points = [...initialPoints];
  let spentPoints = 0n;

  dfs(root);

  /**
   * (1) při průchod směrem dolů zajišťujeme, že každý list má kompetenci alespoň `minPoints` \
   * (2) při průchodu zpět nahoru zajišťujeme, aby kompetence každého člena, byla větší než jeho potomka
   * @param member - počáteční vrchol (člen posádky)
   */
  function dfs(member: number) {
    // (1)
    if (children[member].length === 0 && points[member] < minPoints) {
      spendPoints(member, minPoints);
    }

    for (const child of children[member]) {
      dfs(child);

      // (2)
      if (points[member] <= points[child]) {
        spendPoints(member, points[child] + 1n);
      }
    }
  }

  function spendPoints(member: number, newAmount: bigint) {
    spentPoints += newAmount - points[member];
    points[member] = newAmount;
  }

  return spentPoints <= maxPointsToSpend;
}

/** najde nejvyšší možnou kompetenci posádky, která je v intervalu od `min` do `max` */
function binarySearch(input: Input, min: bigint, max: bigint) {
  while (min < max) {
    // aby někdy nastalo, že (min === max), tak musí mid být roven ceil((min + max) / 2);
    // když tam bude místo ceilu floor (ten je tam defaultně při dělení bigintů), tak
    // se pak algoritmus může zastavit v nekončném cyklu, kde min + 1 = max;
    // ceil tam dáme tak, že přičteme 1n k součtu (min + max)
    const mid = (min + max + 1n) / 2n;

    if (canCrewBeStable(input, mid)) {
      min = mid;
    } else {
      max = mid - 1n;
    }
  }
  assert(min === max);

  return min;
}
