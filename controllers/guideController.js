/*jshint esversion: 6 */

// Render guide page.
exports.guideIndex = function(req, res) {
    const guideStartingContent2 = "You can add as many task as you like by pressing the 'Add Task' button. Keep an eye on the 'Rewards' field to keep track of all completed and approved tasks.";
    const guideStartingContent = "If you're worried about getting your kids organized and making sure they stay on top of their chores and homework this year, you can get them started on new habits with these genius DIY chore ideas.";

    // const amount = 0;
    res.render("guide", {
        guideContent: guideStartingContent, 
        guideContent2: guideStartingContent2 
    });
};