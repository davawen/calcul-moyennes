import { readFileSync } from "fs";

const Color = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
	bright_green: "\x1b[92m",
	bright_white: "\x1b[97m",
};

async function main() {
	let data = JSON.parse(readFileSync('data.json', { encoding: 'utf-8' }));

	interface Nibble<T> {
		_T: number,
		V: T
	};

	interface Note {
		note: Nibble<string>,
		number_note: number,
		bareme: Nibble<string>,
		number_bareme: number,
		date: Nibble<string>,
		service: Nibble<{ L: string }>,
		coefficient: number,
		estRamenerSur20: boolean,
		absent: boolean
	};

	let notes: Note[] = ( data.donneesSec.donnees.listeDevoirs.V as Note[] ).map(n => ({
		note: n.note,
		number_note: parseFloat(n.note.V),
		bareme: n.bareme,
		number_bareme: parseFloat(n.bareme.V),
		date: n.date,
		service: n.service,
		coefficient: n.coefficient,
		estRamenerSur20: n.estRamenerSur20,
		absent: isNaN(parseFloat(n.note.V))
	}));

	let matieres: { [k: string]: Note[] } = {};

	notes.forEach(n => {
		let m = n.service.V.L;

		if(matieres[m] === undefined) matieres[m] = [ n ];
		else matieres[m].push(n);
	});

	const arrondi = (note: number): number => {
		return Math.round(note * 20 * 10) / 10;
	};

	const decorate_note = (note: number, bareme: number = 20): string => {
		let col = Color.green;

		const normalized = note / bareme * 20;

		if(normalized < 10) col = Color.red;
		else if(normalized < 15) col = Color.yellow;
		else if(normalized == 20) col = Color.cyan;

		return `${col}${note}${Color.reset}/${bareme}`;
	};

	let moyenneGen = 0;
	let diviseurGen = 0;

	for(const k in matieres) {
		console.log(`${k}: `);

		let moyenne = 0;
		let diviseur = 0;

		matieres[k].forEach(n => {
			console.log(`    ${n.absent ? "Abs" : decorate_note(n.number_note, n.number_bareme)}  Coef: ${n.coefficient}${n.estRamenerSur20 ? "(Ramené sur 20)" : ""}`)

			if(n.absent) return;

			let note = n.number_note;
			let bareme = n.number_bareme;

			if(n.estRamenerSur20) {
				let diff = 20 / bareme;
				note *= diff;
				bareme = 20;
			}

			note *= n.coefficient;
			bareme *= n.coefficient;

			moyenne += note;
			diviseur += bareme;

			moyenneGen += note;
			diviseurGen += bareme;
		});

		console.log(`\n    Moyenne en ${Color.green}${k}${Color.reset}: ${decorate_note(arrondi(moyenne / diviseur))}\n`);
	}

	console.log(`\nMoyenne ${Color.yellow}Générale${Color.reset}: ${decorate_note(arrondi(moyenneGen / diviseurGen))}`);
}

main().catch(e => console.error(e));
