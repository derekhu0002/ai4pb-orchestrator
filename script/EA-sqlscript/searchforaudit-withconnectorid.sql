SELECT
    c.ea_guid AS CLASSGUID,
    'Connector' AS CLASSTYPE,
    c.Connector_ID,
    c.Name,
    c.Connector_Type,
	c.Stereotype,
    s.Name AS SourceName,
    t.Name AS TargetName
FROM t_connector c
LEFT JOIN t_object s ON s.Object_ID = c.Start_Object_ID
LEFT JOIN t_object t ON t.Object_ID = c.End_Object_ID
WHERE c.Connector_ID = <Search Term>