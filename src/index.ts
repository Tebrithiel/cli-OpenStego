import { CLIInterface, OpenStego } from './components'
import { Config } from './utils'

const testCredentials = {
	'1Password': 'qergoihqergQERGQAErgoih230987',
	'1Password Secret': 'awefg-saerg98234AGF',
	'Another secret encoded in stego': 'Secret_text',
}

async function main() {
	const terminal = new CLIInterface()
	const config = new Config()
	const openStego = new OpenStego(config)
	const { stegoPassword } = await terminal.getStegoPassword()

	const decryptedStego = openStego.decryptStego({ stegoPassword }) as Record<
		string,
		string
	>

	console.log(decryptedStego)

	const test2 = await terminal.addCredential()

	console.log(test2)

	const edited = await terminal.editCredentials(decryptedStego)

	console.log(edited)
}

main()
