# Update Word Bank Spec

## Why
The current word bank is hardcoded and limited. Users want a more extensive and standard word bank.

## What Changes
- Move hardcoded words from `server/index.js` to a structured JSON file `server/words.json`.
- Implement a `WordManager` class to handle word loading and selection.
- Update the `pickWord` logic to support picking from the standard bank.

## Impact
- **Affected code**: `server/index.js`.
- **New files**: `server/words.json`, `server/wordManager.js`.

## ADDED Requirements
### Requirement: Standard Word Bank
The system SHALL load words from a `words.json` file on startup.
- The JSON file SHALL support categories (e.g., "Animals", "Objects").
- The system SHALL allow selecting a random word from the entire bank.

## MODIFIED Requirements
### Requirement: Word Selection
The `pickWord` function SHALL be updated to use the `WordManager`.

## REMOVED Requirements
### Requirement: Hardcoded Words
**Reason**: Replaced by `words.json`.
**Migration**: Existing hardcoded words will be moved to `words.json`.
