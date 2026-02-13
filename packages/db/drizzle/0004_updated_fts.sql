-- INSERT TRIGGER
CREATE TRIGGER `content_fts_insert` AFTER INSERT ON `content` BEGIN
  INSERT INTO `content_fts` (rowid, title, subtitle, content, hidden_content, tags)
  VALUES (new.id, new.title, new.subtitle, new.content, new.hidden_content, '');
END;