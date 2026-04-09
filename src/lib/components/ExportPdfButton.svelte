<script lang="ts">
	import { FileDown, Loader2 } from 'lucide-svelte';
	import jsPDF from 'jspdf';
	import autoTable from 'jspdf-autotable';
	import { Capacitor } from '@capacitor/core';
	import { Filesystem, Directory } from '@capacitor/filesystem';
	import { Share } from '@capacitor/share';
	import type { transaction, tranStats } from '$lib/utils/types';

	interface Props {
		transactions: transaction[];
		stats: tranStats;
		businessName: string;
	}

	let { transactions, stats, businessName }: Props = $props();
	let processing = $state(false);

	async function generatePDF() {
		try {
			processing = true;
			const doc = new jsPDF();
			const now = new Date();
			const dateStr = now.toLocaleDateString('en-IN', {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			});

			// --- 1. Branding & Header ---
			doc.setFillColor(0, 0, 0); // Black header bar
			doc.rect(0, 0, 210, 40, 'F');

			doc.setTextColor(255, 255, 255);
			doc.setFontSize(22);
			doc.setFont('helvetica', 'bold');
			doc.text('LedgerIt', 14, 20);

			doc.setFontSize(10);
			doc.setFont('helvetica', 'normal');
			doc.text('TRANSACTION STATEMENT', 14, 28);
			doc.text(businessName.toUpperCase(), 14, 33);

			// --- 2. Summary Section ---
			doc.setTextColor(0, 0, 0);
			doc.setFontSize(10);
			doc.text(`Report Generated: ${dateStr}`, 14, 50);

			autoTable(doc, {
				startY: 55,
				head: [['Net Balance', 'Total Cash In', 'Total Cash Out']],
				body: [
					[
						`INR ${stats.net_balance.toLocaleString('en-IN')}`,
						`INR ${stats.cash_in.toLocaleString('en-IN')}`,
						`INR ${stats.cash_out.toLocaleString('en-IN')}`
					]
				],
				theme: 'plain',
				styles: { fontSize: 12, fontStyle: 'bold', halign: 'center' },
				headStyles: { textColor: [100, 100, 100], fontSize: 8, fontStyle: 'normal' }
			});

			// --- 3. Main Transaction Table ---
			const tableRows = transactions.map((tx) => {
				const createdAt = new Date(tx.created_at);
				const d = createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
				const t = createdAt.toLocaleTimeString('en-IN', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: true
				});

				return [
					`${d}\n${t}`, // Column 0: Date & Time
					tx.party_name || 'Self', // Column 1: Party
					tx.category_name || '-', // Column 2: Category
					tx.receipt_no || '-', // Column 3: Ref/Receipt No
					tx.user_name, // Column 4: Entry By
					tx.mode.toUpperCase(), // Column 5: Mode
					{
						content: tx.direction === 'in' ? '+ ' + tx.amount : '- ' + tx.amount,
						styles: {
							textColor: tx.direction === 'in' ? [16, 185, 129] : [239, 68, 68],
							fontStyle: 'bold'
						}
					}
				];
			});

			autoTable(doc, {
				startY: (doc as any).lastAutoTable.finalY + 10,
				head: [['Date/Time', 'Party', 'Category', 'Ref No', 'Entry By', 'Mode', 'Amount']],
				body: tableRows,
				theme: 'striped',
				headStyles: {
					fillColor: [30, 30, 30],
					textColor: [255, 255, 255],
					fontStyle: 'bold',
					fontSize: 8
				},
				styles: {
					fontSize: 7.5,
					cellPadding: 3,
					valign: 'middle'
				},
				columnStyles: {
					0: { cellWidth: 22 }, // Date/Time
					3: { cellWidth: 20 }, // Ref No
					4: { cellWidth: 25 }, // Entry By
					5: { cellWidth: 18 }, // Mode
					6: { halign: 'right', cellWidth: 25 } // Amount
				}
			});

			// --- 4. Export Logic (Platform Aware) ---
			const fileName = `LedgerIt_${businessName.replace(/\s+/g, '_')}_${now.getTime()}.pdf`;

			if (Capacitor.isNativePlatform()) {
				const pdfBase64 = doc.output('datauristring').split(',')[1];

				const savedFile = await Filesystem.writeFile({
					path: fileName,
					data: pdfBase64,
					directory: Directory.Cache
				});

				await Share.share({
					title: 'Business Statement',
					text: `Transaction report for ${businessName}`,
					url: savedFile.uri,
					dialogTitle: 'Share Statement'
				});
			} else {
				doc.save(fileName);
			}
		} catch (error) {
			console.error('PDF Generation failed:', error);
		} finally {
			processing = false;
		}
	}
</script>

<button
	onclick={generatePDF}
	disabled={processing || transactions.length === 0}
	class="flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant bg-surface-high text-text-secondary transition-all hover:cursor-pointer hover:border-primary/30 hover:text-primary active:scale-90 disabled:opacity-50"
	title="Export Statement"
>
	{#if processing}
		<Loader2 size={20} class="animate-spin" />
	{:else}
		<FileDown size={20} />
	{/if}
</button>
