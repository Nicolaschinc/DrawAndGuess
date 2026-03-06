export const initialReferenceImagesState = {
  currentWord: "",
  images: [],
  loading: false,
  error: null,
  cache: {},
};

export function normalizeReferenceWord(word) {
  return typeof word === "string" ? word.trim() : "";
}

export function shouldFetchReferenceImages({
  isDrawer,
  showReferenceModal,
  word,
  cache,
  loading,
}) {
  const normalizedWord = normalizeReferenceWord(word);

  return Boolean(
    isDrawer &&
      showReferenceModal &&
      normalizedWord &&
      !cache[normalizedWord] &&
      !loading
  );
}

export function referenceImagesReducer(state, action) {
  switch (action.type) {
    case "sync-word": {
      const nextWord = normalizeReferenceWord(action.word);

      return {
        ...state,
        currentWord: nextWord,
        images: nextWord ? state.cache[nextWord] ?? [] : [],
        loading: false,
        error: null,
      };
    }
    case "request-start": {
      const nextWord = normalizeReferenceWord(action.word);

      if (!nextWord) {
        return state;
      }

      return {
        ...state,
        currentWord: nextWord,
        images: state.cache[nextWord] ?? state.images,
        loading: true,
        error: null,
      };
    }
    case "request-success": {
      const nextWord = normalizeReferenceWord(action.word);
      const nextImages = Array.isArray(action.images) ? action.images : [];
      const nextCache = nextWord
        ? { ...state.cache, [nextWord]: nextImages }
        : state.cache;

      return {
        ...state,
        cache: nextCache,
        loading: false,
        error: null,
        images: state.currentWord === nextWord ? nextImages : state.images,
      };
    }
    case "request-error":
      return {
        ...state,
        loading: false,
        error: action.error ?? "unknown",
        images: state.cache[state.currentWord] ?? [],
      };
    case "request-cancel":
      return {
        ...state,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
}
