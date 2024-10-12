const input = Deno.readTextFileSync('./io/input.txt')
  .split('\n')
  .map((e) => e.split(' ').map((e) => +e));

const t = input.shift()![0];

for (let i = 0; i < t; i++) {
  const [n, vUp, vStill, vDown] = input.shift()!;

  let totalDistance = 0;
  let prev: null | { x: number; y: number; z: number } = null;

  for (let j = 0; j < n; j++) {
    const [x, y, z] = input.shift()!;

    if (prev !== null) {
      const distance = Math.hypot(prev.x - x, prev.y - y, prev.z - z);

      let speed;
      if (z > prev.z) speed = vUp;
      else if (z === prev.z) speed = vStill;
      else speed = vDown;

      totalDistance += distance / speed;
    }

    prev = { x, y, z };
  }

  console.log(totalDistance);
}
