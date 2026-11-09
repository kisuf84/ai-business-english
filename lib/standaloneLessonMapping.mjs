function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function filenameSlug(filename) {
  return slugify(String(filename).replace(/\.html?$/i, ""));
}

export function createCorporateLessonKeyMap(catalog) {
  const map = Object.create(null);
  for (const family of catalog.families) {
    for (const category of family.categories) {
      const categoryKey = slugify(category.label);
      for (const lesson of category.lessons) {
        map[`${family.slug}|${categoryKey}|${lesson.slug}`] = lesson.contentKey;
      }
    }
  }
  return map;
}

export function createAcademyLessonKeyMap(catalog) {
  const map = Object.create(null);
  for (const level of catalog.levels) {
    for (const lesson of level.lessons) {
      map[`${level.slug}|${lesson.slug}`] = lesson.contentKey;
    }
  }
  return map;
}

export function getCorporateLessonContentKey(lesson, keyMap) {
  const family = lesson.section === "langslatePro" ? "pro" : String(lesson.section).toLowerCase();
  const lookup = `${family}|${slugify(lesson.categoryLabel)}|${filenameSlug(lesson.filename)}`;
  return keyMap[lookup] ?? null;
}

export function getAcademyLessonContentKey(lesson, keyMap) {
  const level = String(lesson.level).toLowerCase();
  const stem = String(lesson.filename).replace(/\.html?$/i, "");
  let lookup = `${level}|${slugify(stem)}`;
  let contentKey = keyMap[lookup];

  // Five A1 prototype filenames predate the corresponding renamed R2 objects.
  if (!contentKey) {
    const renamedTopic = stem.match(/^lesson\d+_(.+)$/i)?.[1];
    if (renamedTopic) {
      lookup = `${level}|${slugify(renamedTopic)}`;
      contentKey = keyMap[lookup];
    }
  }

  return contentKey ?? null;
}

export function createLessonR2AdapterScript(product, urlMap) {
  const normalizedProduct = product === "365" ? "365" : product;
  const family = JSON.stringify(normalizedProduct);
  const map = JSON.stringify(urlMap);
  const lookup = normalizedProduct === "corporate"
    ? `var section=lesson.section==='langslatePro'?'pro':String(lesson.section).toLowerCase();var category=slug(lesson.categoryLabel);var stem=String(lesson.filename).replace(/\\.html?$/i,'');var key=section+'|'+category+'|'+slug(stem);`
    : `var level=String(lesson.level).toLowerCase();var stem=String(lesson.filename).replace(/\\.html?$/i,'');var key=level+'|'+slug(stem);if(!map[key]){var renamed=stem.match(/^lesson\\d+_(.+)$/i);if(renamed){key=level+'|'+slug(renamed[1]);}}`;

  const resolve = `var mapped=map[key];if(!mapped)throw new Error('No R2 catalog entry for '+lesson.filename);lesson.url=mapped.url;`;

  const primaryStateKey = normalizedProduct === "corporate" ? "lc_state_v1" : "la_state_v4";
  const previousStateKey = normalizedProduct === "corporate" ? "lc_state_v2" : "la_state_v4";
  return `(function(){'use strict';var product=${family};var map=${map};function slug(value){return String(value).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}if(typeof LESSONS==='undefined'||!Array.isArray(LESSONS))throw new Error('Original lesson manifest is unavailable');LESSONS.forEach(function(lesson){${lookup}${resolve}});try{var primaryKey=${JSON.stringify(primaryStateKey)};var previousKey=${JSON.stringify(previousStateKey)};var raw=localStorage.getItem(primaryKey);var previousRaw=previousKey!==primaryKey?localStorage.getItem(previousKey):null;var target=raw?JSON.parse(raw):(previousRaw?JSON.parse(previousRaw):null);var previous=previousRaw?JSON.parse(previousRaw):null;var completed=target&&target.completed&&typeof target.completed==='object'?Object.assign({},target.completed):{};var changed=false;LESSONS.forEach(function(lesson){var identity=${normalizedProduct === "corporate" ? "(lesson.section==='langslatePro'?'pro':String(lesson.section).toLowerCase())+'|'+slug(lesson.categoryLabel)+'|'+slug(String(lesson.filename).replace(/\\.html?$/i,''))" : "String(lesson.level).toLowerCase()+'|'+(function(){var stem=String(lesson.filename).replace(/\\.html?$/i,'');var k=slug(stem);if(!map[String(lesson.level).toLowerCase()+'|'+k]){var renamed=stem.match(/^lesson\\d+_(.+)$/i);if(renamed)k=slug(renamed[1]);}return k;})()"};var entry=map[identity];if(!entry)return;var id=String(lesson.id);if(Object.prototype.hasOwnProperty.call(completed,entry.contentKey)){if(!Object.prototype.hasOwnProperty.call(completed,id))completed[id]=completed[entry.contentKey];delete completed[entry.contentKey];changed=true;}if(previous&&previous!==target&&previous.completed&&Object.prototype.hasOwnProperty.call(previous.completed,entry.contentKey)&&!Object.prototype.hasOwnProperty.call(completed,id)){completed[id]=previous.completed[entry.contentKey];changed=true;}});if(target&&changed){target.completed=completed;localStorage.setItem(primaryKey,JSON.stringify(target));}}catch(e){/* Never block lesson loading when local progress storage is unavailable. */}})();`;
}
