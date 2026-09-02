/**
 * Browser Storage Composable
 * 
 * Provides reactive Vue refs that automatically sync with chrome.storage.
 * Handles type-safe storage with validation, deep merging, and cross-tab synchronization.
 * 
 * Key features:
 * - Automatic two-way sync between Vue state and browser storage
 * - Deep merge strategy to preserve nested object structures
 * - Type validation to prevent data corruption
 * - Support for both sync (cross-device) and local storage
 */
import { ref, watch, nextTick } from "vue"
import { toPlainStorageValue } from "@/utils/storageSerialization"

/**
 * Deep Merge Algorithm for Storage Values
 * 
 * Intelligently merges stored values with defaults while preserving types.
 * This is critical when the extension updates and introduces new default
 * properties - we want to keep user's existing values while adding new fields.
 * 
 * @param defaults - The default/expected structure with all fields
 * @param source - The stored value (may be incomplete or outdated)
 * @returns Merged object with all default keys + stored values where valid
 * 
 * Example: If default has {a: 1, b: 2} and storage has {a: 5}, 
 *          result will be {a: 5, b: 2} - preserving user's 'a' but adding new 'b'
 */
function mergeDeep(defaults: any, source: any): any {
	const output = { ...defaults }

	Object.keys(defaults).forEach((key) => {
		const defaultValue = defaults[key]
		const sourceValue = source?.[key]

		if (isObject(defaultValue) && sourceValue != null) {
			// Recursively merge nested objects to preserve structure
			output[key] = mergeDeep(defaultValue, sourceValue)
		} else if (checkType(defaultValue, sourceValue)) {
			output[key] = convertValue(defaultValue, sourceValue)
		} else {
			// Type mismatch - use default to prevent errors
			output[key] = defaultValue
			console.log("Type mismatch", key, sourceValue)
		}
	})

	return output
}

/**
 * Type Compatibility Check
 * 
 * Validates that a stored value's type matches the expected default type.
 * Special handling for arrays: accepts both arrays and objects (for conversion).
 * 
 * Why accept objects for arrays: Older versions may have stored arrays as
 * object-indexed collections. We convert these gracefully rather than rejecting.
 */
function checkType(defaultValue: any, value: any): boolean {
	if (Array.isArray(defaultValue)) {
		if (typeof value === 'object' && !Array.isArray(value)) {
			return true // Allow conversion from object to array
		}
		return Array.isArray(value)
	}
	return (typeof value === typeof defaultValue) || value === null
}

/**
 * Value Type Conversion
 * 
 * Converts stored values to match expected types when possible.
 * Primary use case: Converting object-indexed collections to proper arrays.
 */
function convertValue(defaultValue: any, value: any): any {
	if (Array.isArray(defaultValue) && typeof value === 'object' && !Array.isArray(value)) {
		return Object.values(value)
	}
	return value
}

function isObject(value: any): boolean {
	return value !== null && value instanceof Object && !Array.isArray(value)
}

export function useBrowserSyncStorage<T>(key: string, defaultValue: T) {
	return useBrowserStorage(key, defaultValue, "sync")
}

export function useBrowserLocalStorage<T>(key: string, defaultValue: T) {
	return useBrowserStorage(key, defaultValue, "local")
}

/**
 * Core Browser Storage Hook
 * 
 * Creates a reactive Vue ref that bidirectionally syncs with chrome.storage.
 * This enables seamless storage integration in Vue components without
 * manual storage API calls.
 * 
 * @param key - Storage key (must be unique across extension)
 * @param defaultValue - Default value and type template
 * @param storageType - "sync" for cross-device sync, "local" for device-only
 * 
 * How it works:
 * 1. Initializes ref with stored value (merged with defaults if object)
 * 2. Sets up Vue watcher to write changes to storage
 * 3. Sets up storage listener to sync changes from other contexts
 * 4. Uses flag to prevent infinite update loops
 * 
 * The isUpdatingFromStorage flag is critical: Without it, storage changes
 * would trigger Vue watchers which would write back to storage, creating
 * an infinite loop. The flag breaks this cycle by suppressing watchers
 * during storage-initiated updates.
 * 
 * @returns { data: Ref<T>, promise: Promise } - Reactive ref and initialization promise
 */
function useBrowserStorage<T>(key: string, defaultValue: T, storageType: "sync" | "local" = "sync") {
	const data = ref<T>(defaultValue)
	// Prevents write-back loops during storage-initiated updates
	let isUpdatingFromStorage = true
	const defaultIsObject = isObject(defaultValue)
	
	// Async initialization from storage
	const promise = new Promise((resolve) => {
		chrome.storage[storageType].get(key, async (result) => {
			if (result?.[key] !== undefined) {
				if (defaultIsObject && isObject(result[key])) {
					data.value = mergeDeep(defaultValue, result[key])
				} else if (checkType(defaultValue, result[key])) {
					data.value = result[key]
				}
			}
			await nextTick()
			isUpdatingFromStorage = false
			resolve(true)
		})
	})

	// Watch Vue state changes and persist to storage
	watch(
		data,
		(newValue) => {
			if (!isUpdatingFromStorage) {
				if (checkType(defaultValue, newValue)) {
					chrome.storage[storageType].set({ [key]: toPlainStorageValue(newValue) })
				} else {
					console.error("not updating " + key + ": type mismatch")
				}
			}
		},
		{ deep: true, flush: "post" },
	)
	
	// Listen for storage changes from other contexts (other tabs, popup, background)
	chrome.storage[storageType].onChanged.addListener(async function (changes) {
		if (changes?.[key]) {
			isUpdatingFromStorage = true
			const { newValue } = changes[key]
			if (defaultIsObject && isObject(newValue)) {
				data.value = mergeDeep(defaultValue, newValue)
			} else if (checkType(defaultValue, newValue)) {
				data.value = convertValue(defaultValue, newValue)
			}
			await nextTick()
			isUpdatingFromStorage = false
		}
	})
	return { data, promise }
}
