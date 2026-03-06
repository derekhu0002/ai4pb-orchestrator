SELECT
	t_object.ea_guid AS CLASSGUID,
    t_object.Name AS Element,
    t_object.Object_ID,
    't_object' AS CLASSTABLE
FROM t_object
WHERE
       UPPER(t_object.Name) LIKE UPPER('%<Search Term>%')
    OR UPPER(COALESCE(t_object.Alias, '')) LIKE UPPER('%<Search Term>%')
    OR UPPER(COALESCE(t_object.Stereotype, '')) LIKE UPPER('%<Search Term>%')
    OR UPPER(COALESCE(t_object.Note, '')) LIKE UPPER('%<Search Term>%')
ORDER BY t_object.Name ASC;