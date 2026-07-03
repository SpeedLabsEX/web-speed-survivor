// One-off asset generator: produces a black-tinted version of the Speed
// Survivor logo (preserving transparency) for use on the green share/win card,
// matching the mobile app which tints the logo to #000. Run with `node`.
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC = path.resolve(
	__dirname,
	"../../mobile-speed-survivor/assets/logo.png",
);
const DEST = path.resolve(__dirname, "../public/brand/logo-header-black.png");

const base = sharp(SRC).ensureAlpha();
const meta = await base.metadata();
const width = meta.width ?? 1024;
const height = meta.height ?? 340;

const alphaRaw = await sharp(SRC)
	.ensureAlpha()
	.extractChannel("alpha")
	.raw()
	.toBuffer();

await sharp({
	create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
})
	.joinChannel(alphaRaw, { raw: { width, height, channels: 1 } })
	.png()
	.toFile(DEST);

console.log(`Wrote ${DEST} (${width}x${height})`);
