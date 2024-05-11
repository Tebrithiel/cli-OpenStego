export function toCamelCaseWithoutSpaces(input: string): string {
	return input
		.replace(/\s+/g, '')
		.replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) =>
			index === 0 ? match.toLowerCase() : match.toUpperCase(),
		)
}
