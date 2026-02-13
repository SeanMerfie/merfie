CREATE VIRTUAL TABLE `content_fts` USING fts5(
	`title`,
    `subtitle`,
    `content`,
    `hidden_content`,
    `tags`,
    content='',
    contentless_delete=1
);