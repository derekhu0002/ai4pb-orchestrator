!INC Local Scripts.EAConstants-JScript

/*
 * Script Name: AddAllElementsToDiagram
 * Description: Adds all elements from the selected Project Browser package/element (recursive) to the currently open diagram.
 * Language: JScript
 */

function main()
{
    // Show the script output window
    Repository.EnsureOutputVisible("Script");
    // 1. Get the currently open diagram
    var currentDiagram = Repository.GetCurrentDiagram();

    if ( currentDiagram == null )
    {
        Session.Prompt( "Please open a diagram first.", promptOK );
        return;
    }

    // 2. Get selected package or element from the Project Browser
    var selectedPackage = null;
    var selectedElement = null;
    var selectionLabel = "";
    var targetElements = [];
    var seenElementIds = {};

    var treeType = Repository.GetTreeSelectedItemType();

    if ( treeType == otPackage )
    {
        selectedPackage = Repository.GetTreeSelectedPackage();
        if ( selectedPackage == null )
        {
            Session.Output( "Package selection detected, but package object is null.");
            return;
        }

        selectionLabel = "Package: " + selectedPackage.Name;
        collectFromPackageRecursive( selectedPackage, targetElements, seenElementIds );
    }
    else if ( treeType == otElement )
    {
        var treeObject = Repository.GetTreeSelectedObject();
        if ( treeObject != null )
        {
            selectedElement = treeObject;
            selectionLabel = "Element: " + selectedElement.Name;

            // For element selection, do NOT include the selected element itself.
            // Only include elements under it (its descendants).
            var childElements = selectedElement.Elements;
            for ( var c = 0; c < childElements.Count; c++ )
            {
                collectElementAndChildrenRecursive( childElements.GetAt(c), targetElements, seenElementIds );
            }
        }
        else
        {
            Session.Output( "Element selection detected, but element object is null.");
            return;
        }
    }
    else
    {
        Session.Output( "Please select a package or element in the Project Browser.");
        return;
    }

    // 3. Save the diagram first
    Repository.SaveDiagram( currentDiagram.DiagramID );

    Session.Output( "Processing " + selectionLabel );

    // 4. Setup layout variables (Simple Grid Layout)
    var startX = 20;
    var startY = 20;
    var width = 120; // Default width of element
    var height = 60; // Default height of element
    var gapX = 20;
    var gapY = 20;
    var maxRowItems = 5; // How many items per row before wrapping
    
    var currentX = startX;
    var currentY = startY;
    var count = 0;
    var checkedCount = 0;
    var addedCount = 0;
    var skippedCount = 0;

    // Get existing Object IDs on diagram to prevent duplicates
    var existingIds = [];
    var diagramObjects = currentDiagram.DiagramObjects;
    for ( var i = 0; i < diagramObjects.Count; i++ )
    {
        var existingObj = diagramObjects.GetAt( i );
        existingIds.push( existingObj.ElementID );
    }

    // 5. Iterate through target elements (recursive)
    for ( var i = 0; i < targetElements.length; i++ )
    {
        var currentElement = targetElements[i];
        checkedCount++;

        // Skip if element is already on diagram
        if ( !isArrayContains(existingIds, currentElement.ElementID) )
        {
            // Construct position string: "l=10;r=100;t=10;b=100"
            var left = currentX;
            var right = currentX + width;
            var top = currentY;
            var bottom = currentY + height;
            
            // Note: EA coordinates: Top is usually smaller (0), Bottom is larger. 
            // However, in the API string, it's often standard Windows coords. 
            // EA internal logic: Y increases downwards in DiagramObjects mostly.
            // String format: "l=...;r=...;t=...;b=..."
            var positionString = "l=" + left + ";r=" + right + ";t=" + (-top) + ";b=" + (-bottom);

            // Create the Diagram Object
            var newDiagramObject = currentDiagram.DiagramObjects.AddNew( positionString, "" );
            newDiagramObject.ElementID = currentElement.ElementID;
            newDiagramObject.Update();

            Session.Output( "ADDED: " + currentElement.Name + " [ElementID=" + currentElement.ElementID + "]" );
            
            addedCount++;
            count++;

            // Update Grid Position for next element
            if ( count % maxRowItems == 0 )
            {
                currentX = startX;
                currentY += (height + gapY);
            }
            else
            {
                currentX += (width + gapX);
            }
        }
        else
        {
            skippedCount++;
            Session.Output( "SKIP (already on diagram): " + currentElement.Name + " [ElementID=" + currentElement.ElementID + "]" );
        }
    }

    // 6. Finalize
    if ( addedCount > 0 )
    {
        currentDiagram.Update();
        Repository.ReloadDiagram( currentDiagram.DiagramID );
        
        // Optional: Auto-Layout using EA's algorithm to make it look pretty
        // Uncomment the line below if you prefer EA's automatic layout over the grid above
        // Repository.GetProjectInterface().LayoutDiagramEx(currentDiagram.DiagramGUID, 0, 4, 20, 20, true);
        
        Session.Output( "Checked: " + checkedCount + "\nAdded: " + addedCount + "\nSkipped: " + skippedCount);
    }
    else
    {
        Session.Output( "Checked: " + checkedCount + "\nAdded: 0\nSkipped: " + skippedCount + "\nNo new elements were added.");
    }
}

// Helper to check array
function isArrayContains(arr, val) {
    for (var k = 0; k < arr.length; k++) {
        if (arr[k] == val) return true;
    }
    return false;
}

function collectFromPackageRecursive(pkg, result, seen)
{
    var elements = pkg.Elements;
    for (var i = 0; i < elements.Count; i++)
    {
        collectElementAndChildrenRecursive(elements.GetAt(i), result, seen);
    }

    var childPackages = pkg.Packages;
    for (var j = 0; j < childPackages.Count; j++)
    {
        collectFromPackageRecursive(childPackages.GetAt(j), result, seen);
    }
}

function collectElementAndChildrenRecursive(element, result, seen)
{
    if (seen[element.ElementID])
    {
        return;
    }

    seen[element.ElementID] = true;
    result.push(element);

    var childElements = element.Elements;
    for (var i = 0; i < childElements.Count; i++)
    {
        collectElementAndChildrenRecursive(childElements.GetAt(i), result, seen);
    }
}

main();