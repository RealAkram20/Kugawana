<?php

namespace App\Http\Controllers\Console;

use App\Enums\SupportReportStatus;
use App\Http\Controllers\Controller;
use App\Models\SupportReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Illuminate\View\View;

class SupportReportController extends Controller
{
    public function index(Request $request): View
    {
        $status = $request->string('status')->trim()->value();

        $reports = SupportReport::with(['user', 'handler'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return view('console.support.reports.index', [
            'title' => 'Reported problems',
            'reports' => $reports,
            'status' => $status,
            'counts' => SupportReport::selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
        ]);
    }

    public function show(SupportReport $report): View
    {
        return view('console.support.reports.show', [
            'title' => 'Report #' . $report->id,
            'report' => $report->load(['user', 'handler']),
        ]);
    }

    public function update(Request $request, SupportReport $report): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', new Enum(SupportReportStatus::class)],
            'admin_response' => ['nullable', 'string', 'max:5000'],
        ]);

        $closed = in_array($data['status'], [
            SupportReportStatus::Resolved->value,
            SupportReportStatus::Closed->value,
        ], true);

        // Stamp who closed it and when, so the queue keeps its own history without
        // the admin having to fill in two more fields by hand.
        $data['resolved_at'] = $closed ? ($report->resolved_at ?? now()) : null;
        $data['handled_by'] = $closed ? ($report->handled_by ?? auth()->id()) : $report->handled_by;

        $report->update($data);

        return redirect()->route('console.support.reports.index')->with('toast', 'Report updated');
    }
}
