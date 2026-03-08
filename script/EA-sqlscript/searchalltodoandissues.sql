SELECT t_object.Name as [Element], t_object.Author, t_objectproblems.Problem, t_objectproblems.ProblemNotes, t_objectproblems.ResolverNotes, t_objectproblems.Status, t_objectproblems.Priority, t_objectproblems.DateReported, t_objectproblems.ResolvedBy, t_objectproblems.DateResolved  as [Completed], t_objectproblems.ProblemType, t_objectproblems.Object_ID, 't_objectproblems' as CLASSTABLE
FROM t_objectproblems, t_object
WHERE
(t_objectproblems.ProblemType = 'ToDo' OR t_objectproblems.ProblemType = 'Issue') AND
t_objectproblems.Object_ID = t_object.Object_ID AND
t_objectproblems.DateReported IS NOT NULL AND
t_objectproblems.DateReported >= #Now - 9999# AND
t_objectproblems.DateReported < #Now +1d#


ORDER BY
 t_objectproblems.ResolvedBy ASC