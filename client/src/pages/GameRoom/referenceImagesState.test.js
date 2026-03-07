import test from "node:test";
import assert from "node:assert/strict";

import {
  initialReferenceImagesState,
  normalizeReferenceWord,
  resolveReferenceImageUrls,
  referenceImagesReducer,
  shouldFetchReferenceImages,
} from "./referenceImagesState.js";

test("normalizeReferenceWord trims non-empty strings and rejects invalid values", () => {
  assert.equal(normalizeReferenceWord("  cat  "), "cat");
  assert.equal(normalizeReferenceWord("   "), "");
  assert.equal(normalizeReferenceWord(null), "");
});

test("shouldFetchReferenceImages only loads uncached words for an open modal", () => {
  assert.equal(
    shouldFetchReferenceImages({
      isDrawer: true,
      showReferenceModal: true,
      word: "cat",
      cache: {},
    }),
    true
  );

  assert.equal(
    shouldFetchReferenceImages({
      isDrawer: true,
      showReferenceModal: false,
      word: "cat",
      cache: {},
    }),
    false
  );

  assert.equal(
    shouldFetchReferenceImages({
      isDrawer: true,
      showReferenceModal: true,
      word: "cat",
      cache: { cat: ["cached-image"] },
    }),
    false
  );

  assert.equal(
    shouldFetchReferenceImages({
      isDrawer: false,
      showReferenceModal: true,
      word: "cat",
      cache: {},
    }),
    false
  );
});

test("shouldFetchReferenceImages stays eligible while an uncached request is in flight", () => {
  assert.equal(
    shouldFetchReferenceImages({
      isDrawer: true,
      showReferenceModal: true,
      word: "cat",
      cache: {},
      loading: true,
    }),
    true
  );
});

test("resolveReferenceImageUrls rewrites relative proxy paths against the server origin", () => {
  assert.deepEqual(
    resolveReferenceImageUrls(
      [
        "/api/proxy-image?word=cat&style=photo",
        "https://cdn.example.com/cat.png",
        "  ",
      ],
      "https://api.drawguess.example"
    ),
    [
      "https://api.drawguess.example/api/proxy-image?word=cat&style=photo",
      "https://cdn.example.com/cat.png",
    ]
  );
});

test("sync-word resets stale images for uncached words and reuses cached ones immediately", () => {
  const stateWithCache = {
    ...initialReferenceImagesState,
    cache: {
      cat: ["cat-1", "cat-2"],
    },
    images: ["stale-image"],
    loading: true,
    error: "failed",
  };

  const uncachedWordState = referenceImagesReducer(stateWithCache, {
    type: "sync-word",
    word: "dog",
  });

  assert.deepEqual(uncachedWordState.images, []);
  assert.equal(uncachedWordState.loading, false);
  assert.equal(uncachedWordState.error, null);

  const cachedWordState = referenceImagesReducer(uncachedWordState, {
    type: "sync-word",
    word: "cat",
  });

  assert.deepEqual(cachedWordState.images, ["cat-1", "cat-2"]);
  assert.equal(cachedWordState.loading, false);
});

test("request-success caches images without overriding the current word with stale responses", () => {
  const loadingCatState = referenceImagesReducer(initialReferenceImagesState, {
    type: "request-start",
    word: "cat",
  });

  const resolvedCatState = referenceImagesReducer(loadingCatState, {
    type: "request-success",
    word: "cat",
    images: ["cat-1", "cat-2"],
  });

  assert.deepEqual(resolvedCatState.cache.cat, ["cat-1", "cat-2"]);
  assert.deepEqual(resolvedCatState.images, ["cat-1", "cat-2"]);

  const switchedToDogState = referenceImagesReducer(resolvedCatState, {
    type: "sync-word",
    word: "dog",
  });

  const staleCatResponseState = referenceImagesReducer(switchedToDogState, {
    type: "request-success",
    word: "cat",
    images: ["new-cat-image"],
  });

  assert.deepEqual(staleCatResponseState.cache.cat, ["new-cat-image"]);
  assert.deepEqual(staleCatResponseState.images, []);
});
