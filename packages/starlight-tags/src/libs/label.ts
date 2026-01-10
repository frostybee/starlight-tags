import starlightConfig from 'virtual:starlight/user-config';

import { getLangFromLocale, type Locale } from './i18n.js';

export function getTagLabel(locale: Locale, labelObject: string | Record<string, string>): string {
	if (typeof labelObject === 'string') return labelObject;

	let label: string;
	const lang = getLangFromLocale(locale);

	if (labelObject[lang]) {
		label = labelObject[lang];
	} else {
		const defaultLang = starlightConfig.defaultLocale.lang ?? starlightConfig.defaultLocale.locale;
		label = defaultLang ? (labelObject[defaultLang] ?? '') : '';
	}

	if (label.length === 0) {
		throw new Error(
			'Each tag label must have a key for the default language. The keys must be a valid BCP-47 tags (e.g. `en`, `ar`, or `zh-CN`).'
		);
	}

	return label;
}

export function getTagDescription(
	locale: Locale,
	descriptionObject?: string | Record<string, string>
): string | undefined {
	if (descriptionObject == undefined) return undefined;
	if (typeof descriptionObject === 'string') return descriptionObject;

	let description: string;
	const lang = getLangFromLocale(locale);

	if (descriptionObject[lang]) {
		description = descriptionObject[lang];
	} else {
		const defaultLang = starlightConfig.defaultLocale.lang ?? starlightConfig.defaultLocale.locale;
		description = defaultLang ? (descriptionObject[defaultLang] ?? '') : '';
	}

	if (description.length === 0) {
		throw new Error(
			'Each tag description must have a key for the default language. The keys must be a valid BCP-47 tags (e.g. `en`, `ar`, or `zh-CN`).'
		);
	}

	return description;
}
